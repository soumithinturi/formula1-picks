# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Formula 1 Picks** is a full-stack web application for F1 fans to make predictions, join leagues, and compete on leaderboards. The stack spans two runtimes:

- **Backend**: Hono REST API running on Cloudflare Workers with Supabase PostgreSQL (via Hyperdrive pooling)
- **Frontend**: React 19 PWA with Tailwind CSS, built and deployed via Bun/Cloudflare Pages

The application uses **GitHub Actions webhooks** to trigger cron-job-like tasks (schedule/results sync, notifications) via Worker internal endpoints.

---

## Development Commands

### Backend (Node.js/Wrangler)

```bash
cd backend

# Install deps
npm install

# Local dev (HTTP API at localhost:8787)
npm run dev

# Run tests
npm run test
npm run test -- src/routes/picks.test.ts  # Single test file

# Deploy to Cloudflare Workers
npm run deploy
```

**Local DB setup**: Edit `backend/wrangler.jsonc` → `hyperdrive[0].localConnectionString` to point to your Supabase direct URL (from Supabase settings → Database → Connection Pooler → direct URL, or Connection String).

### Frontend (Bun)

```bash
cd frontend

# Install deps
bun install

# Dev server (localhost:3000 with HMR)
bun dev

# Build for production
bun run build

# Deploy to Cloudflare Pages
bun run deploy
```

**Environment**: Create `frontend/.env.local`:
```env
BUN_PUBLIC_API_URL=http://localhost:8787  # or your Worker URL in prod
```

---

## Architecture & Key Concepts

### Backend Structure (`backend/src/`)

- **`index.ts`**: Main Hono app. Registers all routes, sets up CORS, injects DB/Supabase into context.
- **`routes/`**: Organized by domain (auth, races, picks, leagues, etc.). Each is a module exporting handler functions.
- **`services/`**: Business logic (scoring, notifications, cron jobs). Pure functions where possible for testability.
- **`db/index.ts`**: Creates postgres.js SQL clients. Disables prepared statements (required for Hyperdrive/PgBouncer).
- **`lib/supabase.ts`**: Supabase JS client initialization.
- **`middleware/auth.ts`**: `authMiddleware` extracts JWT from Supabase auth; `adminMiddleware` checks admin role.
- **`types/env.ts`**: Cloudflare Worker bindings (HYPERDRIVE, env vars) and request context (Variables).

**Key Pattern**: Every request injects `db`, `supabase`, and `env` via middleware. Handlers access them as `c.get("db")`, etc.

### Frontend Structure (`frontend/src/`)

- **`screens/`**: Full-page components (home, race details, league, admin panel).
- **`components/`**: Reusable UI organized by domain (racing, leagues, notifications, layout).
- **`components/ui/`**: Shadcn UI primitives (Button, Dialog, Select, etc.).
- **`context/`**: Global state (AuthContext for user session, theme context).
- **`hooks/`**: Reusable logic (`useAuth`, custom data fetching hooks).
- **`lib/`**: Utilities (API calls, formatters, validators).
- **`assets/`**: SVG track circuits, icons.

### Database

Supabase PostgreSQL accessed via **Cloudflare Hyperdrive** (connection pooling). The app uses `postgres.js` for type-safe, tagged-template SQL:

```typescript
const users = await db`SELECT * FROM users WHERE id = ${userId}`;
```

**Connection pooling**: Hyperdrive handles this in production. Locally, set the direct Supabase URL in `wrangler.jsonc`.

### Authentication

Supabase Auth (OTP via email/SMS). JWTs are stored in the Supabase `auth.users` table. The backend extracts and validates JWTs via `authMiddleware` using Supabase's public key (no custom JWK endpoints—use the standard Supabase JWT).

### Scoring & Points

Scoring is a **pure function** (`services/scoring.ts:calculatePoints`) that compares user picks to official results using a configurable scoring schema. Leagues can override defaults per-season.

### Cron Jobs

GitHub Actions workflows (`.github/workflows/`) trigger internal Worker endpoints every ~24h:

- **`/api/v1/internal/cron/schedule`**: Sync F1 season schedule.
- **`/api/v1/internal/cron/standings`**: Sync driver standings.
- **`/api/v1/internal/cron/results`**: Poll race results and trigger scoring.
- **`/api/v1/internal/cron/notifications`**: Push notifications to subscribed users.

Each endpoint is guarded by `x-cron-secret` header (must match `CRON_SECRET` env var).

---

## Testing

### Backend Tests

- **File**: `src/routes/*.test.ts` or `src/services/*.test.ts`
- **Runner**: Bun test (`bun test`)
- **Setup**: `src/__tests__/setup.ts` provides test DB fixtures and helpers.

Example:
```bash
npm run test -- src/routes/picks.test.ts
```

**DB isolation**: Route tests (`routes/*.test.ts`) are integration tests that insert and delete rows through the real app (`__tests__/setup.ts` signs test JWTs and calls `app.request`). They refuse to run unless `DATABASE_URL` points at a **throwaway database** and `CONFIRM_TEST_DB=1` is set:

```bash
DATABASE_URL=postgresql://... CONFIRM_TEST_DB=1 bun test
```

`index.test.ts` and `services/*.test.ts` need no database. Schema changes live in `backend/migrations/` (run by hand in the Supabase SQL editor, oldest first); there is no `0001` baseline yet.

### Frontend Testing

Currently minimal; focus on running the dev server (`bun dev`) and manual testing in the browser.

---

## Deployment

### Secrets & Environment

**Backend secrets** (Cloudflare Workers):
```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SECRET_KEY
npx wrangler secret put SUPABASE_PUBLISHABLE_DEFAULT_KEY
npx wrangler secret put CRON_SECRET
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put VAPID_EMAIL
npx wrangler secret put NODE_ENV=production
```

**Frontend environment** (Cloudflare Pages):
Set `BUN_PUBLIC_API_URL` to your Worker URL in the Pages dashboard → Settings → Environment Variables.

### Hyperdrive

First-time setup (needed once):
```bash
npx wrangler hyperdrive create f1-picks-db \
  --connection-string="postgresql://user:pass@host:5432/postgres"
```
Paste the ID into `backend/wrangler.jsonc` → `hyperdrive[0].id`.

### GitHub Actions Secrets

For cron jobs to work:
- `BACKEND_URL`: Your Worker URL (e.g., `https://f1-picks-api.sintur-labs.workers.dev`)
- `CRON_SECRET`: Must match the Worker's `CRON_SECRET` secret

---

## Important Patterns & Gotchas

### DB Connection Handling

Each request creates a fresh postgres.js client. The `finally` block in `index.ts` closes it after the response. Use `waitUntil()` to avoid blocking the HTTP response.

```typescript
execCtx.waitUntil(
  db.end().catch(err => console.error("DB close error:", err))
);
```

### CORS Configuration

CORS is set up in `index.ts` to allow:
- `localhost:*` in dev
- Production origin (`formula1-picks.sintur-labs.workers.dev`)
- Any `*.sintur-labs.workers.dev` preview/staging origin

### Prepared Statements

Disabled in postgres.js config (`prepare: false`). This is **required** for Hyperdrive and PgBouncer (Supabase's transaction pooler). Don't enable it.

### Type Safety

- Backend: TypeScript strict mode, Zod for runtime validation of inputs.
- Frontend: React 19 with TypeScript, Shadcn UI components.

### PWA & Service Worker

Frontend includes `src/sw.js` (service worker) and `src/manifest.json`. The Bun server explicitly serves these files from memory (see `frontend/src/index.ts` routes) to avoid caching issues.

### Design System

See `DESIGN_GUIDE.md` for the four-layer color theory, typography, and dark mode strategy. Tailwind tokens are mapped to CSS variables.

---

## Useful Git/Merge Patterns

- Commits are squashed; use descriptive commit messages.
- PRs target `main`. Keep history linear.
- Test before pushing: `npm test` in backend, manual `bun dev` in frontend.

---

## Where to Find Things

- **F1 API integration**: `backend/src/routes/races.ts`, `backend/src/routes/drivers.ts`
- **Race pick logic**: `backend/src/routes/picks.ts`
- **League management**: `backend/src/routes/leagues.ts`
- **Scoring logic**: `backend/src/services/scoring.ts`
- **Push notifications**: `backend/src/services/pushService.ts`, `backend/src/services/notifications.ts`
- **Chat messages**: `backend/src/routes/chat.ts`
- **Admin panel**: `frontend/src/screens/admin`
- **Leaderboard**: `frontend/src/screens/leaderboard`
