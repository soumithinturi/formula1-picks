import { requestOtp, verifyOtp } from "./routes/auth.ts";
import { listRaces } from "./routes/races.ts";
import { listDrivers } from "./routes/drivers.ts";
import { getPickForRace, submitPick } from "./routes/picks.ts";
import { createLeague, listLeagues, joinLeague } from "./routes/leagues.ts";
import { getLeaderboard } from "./routes/leaderboard.ts";
import { submitResults } from "./routes/admin.ts";
import { seedDatabase } from "./services/seed.ts";

const PORT = parseInt(process.env.PORT ?? "8080");

// Seed races and drivers on startup (no-op if data already exists)
seedDatabase().catch((err) => {
  console.error("Database seeding failed:", err);
});

const server = Bun.serve({
  port: PORT,
  routes: {
    // ─── Auth ──────────────────────────────────────────────────────────────
    "/api/v1/auth/request": { POST: requestOtp },
    "/api/v1/auth/verify": { POST: verifyOtp },

    // ─── Races ─────────────────────────────────────────────────────────────
    "/api/v1/races": { GET: listRaces },

    // ─── Drivers ───────────────────────────────────────────────────────────
    "/api/v1/drivers": { GET: listDrivers },

    // ─── Picks ─────────────────────────────────────────────────────────────
    "/api/v1/picks/race/:raceId": { GET: getPickForRace },
    "/api/v1/picks": { POST: submitPick },

    // ─── Leagues ───────────────────────────────────────────────────────────
    "/api/v1/leagues": {
      GET: listLeagues,
      POST: createLeague,
    },
    "/api/v1/leagues/join": { POST: joinLeague },

    // ─── Leaderboard ───────────────────────────────────────────────────────
    "/api/v1/leaderboard/:leagueId": { GET: getLeaderboard },

    // ─── Admin ─────────────────────────────────────────────────────────────
    "/api/v1/admin/results": { POST: submitResults },
  },

  // Global error handler
  error(err) {
    console.error("Unhandled server error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  },
});

console.log(`🏎️  F1 Picks API v2 running at ${server.url}`);
