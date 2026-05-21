# Formula 1 Picks

A modern, full-stack web application for Formula 1 fans to make predictions, join leagues, and compete on the leaderboard.

This application is split into two main parts:
- **Frontend**: A React 19 single-page application (PWA support) built with Bun, Tailwind CSS, Shadcn UI, and Framer Motion. Deployed on Cloudflare Pages.
- **Backend**: A REST API built with Hono + TypeScript, running on Cloudflare Workers. Uses Supabase for PostgreSQL and Auth, with cron jobs triggered via GitHub Actions webhooks.

---

## 🏎️ Features

- View upcoming races and driver standings
- Make predictions for race weekends (qualifying, sprint, and race)
- Create and join private leagues with friends
- Real-time leaderboard updates and scoring
- In-app chat within leagues
- Push notifications and PWA installability

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + React Router v7
- **Styling**: Tailwind CSS v4, Radix UI, Framer Motion
- **Tooling**: Bun
- **Hosting**: Cloudflare Pages

### Backend
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: [Hono](https://hono.dev/)
- **Database**: Supabase (PostgreSQL) via [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/)
- **Authentication**: Supabase Auth (OTP — email and SMS)
- **Task Scheduling**: GitHub Actions (cron webhooks → Worker endpoints)
- **Tooling**: Wrangler

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (latest)
- [Node.js](https://nodejs.org/) 18+ (for Wrangler)
- A [Supabase](https://supabase.com/) project
- A [Cloudflare](https://dash.cloudflare.com/) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/formula1-picks.git
cd formula1-picks
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Local environment:**

Create a `.dev.vars` file (Wrangler's local equivalent of secrets):

```bash
cp .dev.vars.example .dev.vars   # if available, otherwise create manually
```

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
CRON_SECRET=a-random-secret-string
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=your@email.com
NODE_ENV=development
```

**Configure Wrangler for local Hyperdrive:**

In `wrangler.jsonc`, set `localConnectionString` inside the `hyperdrive` binding to your Supabase direct connection string. Wrangler uses this during `wrangler dev`; production uses the real Hyperdrive binding.

```jsonc
"hyperdrive": [
  {
    "binding": "HYPERDRIVE",
    "id": "your-hyperdrive-id",
    "localConnectionString": "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
  }
]
```

**Run the local dev server:**
```bash
npm run dev
# API available at http://localhost:8787
```

### 3. Frontend Setup

```bash
cd frontend
bun install
```

Create a `.env.local` file:

```env
BUN_PUBLIC_API_URL=http://localhost:8787
```

**Run the frontend dev server:**
```bash
bun dev
# App available at http://localhost:3000
```

---

## 📦 Deployment

### Backend (Cloudflare Workers)

#### First-time setup

1. **Create a Hyperdrive config** pointing at your Supabase direct connection (port 5432):
   ```bash
   npx wrangler hyperdrive create f1-picks-db \
     --connection-string="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
   ```
   Paste the output ID into `wrangler.jsonc`.

2. **Upload all secrets** to the Worker:
   ```bash
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SECRET_KEY
   npx wrangler secret put SUPABASE_PUBLISHABLE_DEFAULT_KEY
   npx wrangler secret put CRON_SECRET
   npx wrangler secret put VAPID_PUBLIC_KEY
   npx wrangler secret put VAPID_PRIVATE_KEY
   npx wrangler secret put VAPID_EMAIL
   npx wrangler secret put NODE_ENV   # set to "production"
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

#### Subsequent deploys
```bash
npm run deploy
```

### Frontend (Cloudflare Pages)

1. Authenticate:
   ```bash
   bunx wrangler login
   ```
2. Set `BUN_PUBLIC_API_URL` in Cloudflare Pages → Settings → Environment Variables to your Worker URL.
3. Deploy:
   ```bash
   bun run deploy
   ```

### Cron Jobs (GitHub Actions)

Automated tasks (results polling, standings sync, schedule sync, push notifications) are triggered by GitHub Actions on a schedule. They POST to internal Worker endpoints authenticated by `x-cron-secret`.

Set these secrets in your GitHub repo → Settings → Secrets → Actions:
- `BACKEND_URL` — your Worker URL (e.g. `https://f1-picks-api.<account>.workers.dev`)
- `CRON_SECRET` — must match the `CRON_SECRET` secret on the Worker

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary.