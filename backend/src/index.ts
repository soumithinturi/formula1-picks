import { requestOtp, verifyOtp, syncAuth } from "./routes/auth.ts";
import { listRaces } from "./routes/races.ts";
import { listDrivers } from "./routes/drivers.ts";
import { getPickForRace, submitPick } from "./routes/picks.ts";
import { createLeague, listLeagues, joinLeague } from "./routes/leagues.ts";
import { getLeaderboard } from "./routes/leaderboard.ts";
import { submitResults } from "./routes/admin.ts";
import { updateProfile } from "./routes/users.ts";
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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const handleOptions = () => new Response(null, { status: 204, headers: CORS_HEADERS });

const withCors = (handler: (req: Request) => Response | Promise<Response>) =>
  async (req: Request) => {
    const res = await handler(req);
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      res.headers.set(key, value);
    }
    return res;
  };

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

    // ─── Leaderboard ───────────────────────────────────────────────────────
    "/api/v1/leaderboard/:leagueId": {
      GET: withCors(getLeaderboard),
      OPTIONS: handleOptions,
    },

    // ─── Users ─────────────────────────────────────────────────────────────
    "/api/v1/users/me": {
      PUT: withCors(withAuth(updateProfile)),
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
      { status: 500, headers: CORS_HEADERS }
    );
  },
});

console.log(`🏎️  F1 Picks API v2 running at ${server.url}`);
