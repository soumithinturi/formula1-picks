import { requestOtp, verifyOtp, syncAuth } from "./routes/auth.ts";
import { listRaces } from "./routes/races.ts";
import { listDrivers } from "./routes/drivers.ts";
import { getPickForRace, submitPick, getUserPickForRace } from "./routes/picks.ts";
import { createLeague, listLeagues, joinLeague, previewLeague, updateLeague, leaveLeague, deleteLeague } from "./routes/leagues.ts";
import { getLeaderboard } from "./routes/leaderboard.ts";
import { submitResults } from "./routes/admin.ts";
import { updateProfile, getProfile, deleteProfile } from "./routes/users.ts";
import { submitFeedback } from "./routes/feedback.ts";
import { listNotifications, markAllRead } from "./routes/notifications.ts";
import { getChatMessages, sendChatMessage } from "./routes/chat.ts";
import { seedDatabase } from "./services/seed.ts";
import { startCronJobs } from "./services/cron.ts";
import { withAuth } from "./middleware/auth.ts";

const PORT = parseInt(process.env.PORT ?? "8080");

// Seed races and drivers on startup (no-op if data already exists)
seedDatabase()
  .then(() => {
    // Start cron jobs after successful seed check
    startCronJobs();
  })
  .catch((err) => {
    console.error("Database seeding failed:", err);
  });

// Setup dynamic CORS to support credentials (cookies)
const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? ["https://formula1-picks.sintur-labs.workers.dev"]
  : ["http://localhost:3000", "http://127.0.0.1:3000"];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin");

  // If no Origin header (e.g. direct API hit, or non-browser request), allow fallback
  let allowOrigin = ALLOWED_ORIGINS[0];
  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowOrigin = origin;
    } else if (process.env.NODE_ENV === "production" && origin.endsWith(".sintur-labs.workers.dev")) {
      // Support Cloudflare Pages preview URLs
      allowOrigin = origin;
    } else {
      // Echo bad origin so the browser blocks it cleanly
      allowOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
    "Access-Control-Allow-Credentials": "true",
  };
}

const handleOptions = (req: Request) => new Response(null, { status: 204, headers: getCorsHeaders(req) });

const withCors = (handler: (req: Request) => Response | Promise<Response>) =>
  async (req: Request) => {
    const res = await handler(req);
    const headers = getCorsHeaders(req);
    for (const [key, value] of Object.entries(headers)) {
      res.headers.set(key, value);
    }
    return res;
  };

import { logoutUser } from "./routes/auth.ts";

const server = Bun.serve({
  port: PORT,
  routes: {
    // ─── Auth ──────────────────────────────────────────────────────────────
    "/api/v1/auth/request": {
      POST: withCors(requestOtp),
      OPTIONS: handleOptions,
    },
    "/api/v1/auth/verify": {
      POST: withCors(verifyOtp),
      OPTIONS: handleOptions,
    },
    "/api/v1/auth/sync": {
      POST: withCors(syncAuth),
      OPTIONS: handleOptions,
    },
    "/api/v1/auth/logout": {
      POST: withCors(logoutUser),
      OPTIONS: handleOptions,
    },

    // ─── Races ─────────────────────────────────────────────────────────────
    "/api/v1/races": {
      GET: withCors(listRaces),
      OPTIONS: handleOptions,
    },

    // ─── Drivers ───────────────────────────────────────────────────────────
    "/api/v1/drivers": {
      GET: withCors(listDrivers),
      OPTIONS: handleOptions,
    },

    // ─── Picks ─────────────────────────────────────────────────────────────
    "/api/v1/picks/race/:raceId": {
      GET: withCors(getPickForRace),
      OPTIONS: handleOptions,
    },
    "/api/v1/picks/race/:raceId/user/:userId": {
      GET: withCors(getUserPickForRace),
      OPTIONS: handleOptions,
    },
    "/api/v1/picks": {
      POST: withCors(submitPick),
      OPTIONS: handleOptions,
    },

    // ─── Leagues ───────────────────────────────────────────────────────────
    "/api/v1/leagues": {
      GET: withCors(listLeagues),
      POST: withCors(createLeague),
      OPTIONS: handleOptions,
    },
    "/api/v1/leagues/join": {
      POST: withCors(joinLeague),
      OPTIONS: handleOptions,
    },
    "/api/v1/leagues/:id": {
      PATCH: withCors(updateLeague),
      DELETE: withCors(deleteLeague),
      OPTIONS: handleOptions,
    },
    "/api/v1/leagues/:id/leave": {
      POST: withCors(leaveLeague),
      OPTIONS: handleOptions,
    },
    "/api/v1/leagues/invite/:code": {
      GET: withCors(previewLeague),
      OPTIONS: handleOptions,
    },

    // ─── Leaderboard ───────────────────────────────────────────────────────
    "/api/v1/leaderboard/:leagueId": {
      GET: withCors(getLeaderboard),
      OPTIONS: handleOptions,
    },

    // ─── Users ─────────────────────────────────────────────────────────────
    "/api/v1/users/me": {
      GET: withCors(withAuth(getProfile)),
      PUT: withCors(withAuth(updateProfile)),
      DELETE: withCors(withAuth(deleteProfile)),
      OPTIONS: handleOptions,
    },

    // ─── Feedback ──────────────────────────────────────────────────────────
    "/api/v1/feedback": {
      POST: withCors(withAuth(submitFeedback)),
      OPTIONS: handleOptions,
    },

    // ─── Notifications ──────────────────────────────────────────────────────
    "/api/v1/notifications": {
      GET: withCors(listNotifications),
      OPTIONS: handleOptions,
    },
    "/api/v1/notifications/read": {
      PUT: withCors(markAllRead),
      OPTIONS: handleOptions,
    },

    // ─── Chat ──────────────────────────────────────────────────────────────
    "/api/v1/chat": {
      POST: withCors(withAuth(sendChatMessage)),
      OPTIONS: handleOptions,
    },
    "/api/v1/chat/:leagueId": {
      GET: withCors(withAuth(getChatMessages)),
      OPTIONS: handleOptions,
    },

    // ─── Admin ─────────────────────────────────────────────────────────────
    "/api/v1/admin/results": {
      POST: withCors(submitResults),
      OPTIONS: handleOptions,
    },
  },

  // Global error handler
  error(err) {
    console.error("Unhandled server error:", err);
    return Response.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
          "Access-Control-Allow-Credentials": "true"
        }
      }
    );
  },
});

console.log(`🏎️  F1 Picks API v2 running at ${server.url}`);
