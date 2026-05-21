import { Hono } from "hono";
import { cors } from "hono/cors";
import { getDb } from "./db/index.ts";
import { createSupabaseClient } from "./lib/supabase.ts";
import { authMiddleware, adminMiddleware } from "./middleware/auth.ts";
import type { Bindings, Variables } from "./types/env.ts";

// Route handlers
import { requestOtp, verifyOtp, syncAuth, logoutUser } from "./routes/auth.ts";
import { listRaces } from "./routes/races.ts";
import { listDrivers } from "./routes/drivers.ts";
import { getPickForRace, submitPick, getUserPickForRace } from "./routes/picks.ts";
import { createLeague, listLeagues, joinLeague, previewLeague, updateLeague, leaveLeague, deleteLeague } from "./routes/leagues.ts";
import { getLeaderboard } from "./routes/leaderboard.ts";
import { submitResults, testNotification } from "./routes/admin.ts";
import { updateProfile, getProfile, deleteProfile } from "./routes/users.ts";
import { submitFeedback } from "./routes/feedback.ts";
import { listNotifications, markAllRead, subscribePush, unsubscribePush, getNotificationSettings, updateNotificationSettings } from "./routes/notifications.ts";
import { getChatMessages, sendChatMessage } from "./routes/chat.ts";
import { cronSchedule, cronStandings, cronResults, cronNotifications } from "./routes/cron.ts";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─── Health Check ────────────────────────────────────────────────────────────
app.get("/", (c) => c.json({ status: "ok", service: "f1-picks-api" }));

// ─── Middleware: Inject DB, Supabase, and env into every request ────────────
app.use("*", async (c, next) => {
  const db = getDb(c.env.HYPERDRIVE.connectionString);
  const supabase = createSupabaseClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY);
  c.set("db", db);
  c.set("supabase", supabase);
  c.set("env", c.env);
  await next();
});

// ─── CORS ───────────────────────────────────────────────────────────────────
const PROD_ORIGIN = "https://formula1-picks.sintur-labs.workers.dev";

app.use("*", cors({
  origin: (origin, c) => {
    const isProd = c.env.NODE_ENV === "production";
    if (!isProd) {
      // Allow any localhost origin in dev
      if (origin?.startsWith("http://localhost") || origin?.startsWith("http://127.0.0.1")) {
        return origin;
      }
    }
    if (origin === PROD_ORIGIN) return origin;
    // Support Cloudflare Pages preview URLs
    if (isProd && origin?.endsWith(".sintur-labs.workers.dev")) return origin;
    // Echo bad origin so the browser blocks it cleanly
    return origin ?? PROD_ORIGIN;
  },
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "x-client-info", "apikey"],
  credentials: true,
}));

// ─── Auth ───────────────────────────────────────────────────────────────────
app.post("/api/v1/auth/request", requestOtp);
app.post("/api/v1/auth/verify", verifyOtp);
app.post("/api/v1/auth/sync", syncAuth);
app.post("/api/v1/auth/logout", logoutUser);

// ─── Races ──────────────────────────────────────────────────────────────────
app.get("/api/v1/races", authMiddleware, listRaces);

// ─── Drivers ────────────────────────────────────────────────────────────────
app.get("/api/v1/drivers", authMiddleware, listDrivers);

// ─── Picks ──────────────────────────────────────────────────────────────────
app.get("/api/v1/picks/race/:raceId", authMiddleware, getPickForRace);
app.get("/api/v1/picks/race/:raceId/user/:userId", authMiddleware, getUserPickForRace);
app.post("/api/v1/picks", authMiddleware, submitPick);

// ─── Leagues ────────────────────────────────────────────────────────────────
app.get("/api/v1/leagues", authMiddleware, listLeagues);
app.post("/api/v1/leagues", authMiddleware, createLeague);
app.post("/api/v1/leagues/join", authMiddleware, joinLeague);
app.get("/api/v1/leagues/invite/:code", previewLeague);
app.patch("/api/v1/leagues/:id", authMiddleware, updateLeague);
app.delete("/api/v1/leagues/:id", authMiddleware, deleteLeague);
app.post("/api/v1/leagues/:id/leave", authMiddleware, leaveLeague);

// ─── Leaderboard ────────────────────────────────────────────────────────────
app.get("/api/v1/leaderboard/:leagueId", authMiddleware, getLeaderboard);

// ─── Users ──────────────────────────────────────────────────────────────────
app.get("/api/v1/users/me", authMiddleware, getProfile);
app.put("/api/v1/users/me", authMiddleware, updateProfile);
app.delete("/api/v1/users/me", authMiddleware, deleteProfile);

// ─── Feedback ───────────────────────────────────────────────────────────────
app.post("/api/v1/feedback", authMiddleware, submitFeedback);

// ─── Notifications ──────────────────────────────────────────────────────────
app.get("/api/v1/notifications", authMiddleware, listNotifications);
app.put("/api/v1/notifications/read", authMiddleware, markAllRead);
app.post("/api/v1/notifications/subscribe", authMiddleware, subscribePush);
app.delete("/api/v1/notifications/unsubscribe", authMiddleware, unsubscribePush);
app.get("/api/v1/notifications/settings", authMiddleware, getNotificationSettings);
app.put("/api/v1/notifications/settings", authMiddleware, updateNotificationSettings);

// ─── Chat ───────────────────────────────────────────────────────────────────
app.post("/api/v1/chat", authMiddleware, sendChatMessage);
app.get("/api/v1/chat/:leagueId", authMiddleware, getChatMessages);

// ─── Admin ──────────────────────────────────────────────────────────────────
app.post("/api/v1/admin/results", adminMiddleware, submitResults);
app.post("/api/v1/admin/notifications/test", adminMiddleware, testNotification);

// ─── Internal Cron Webhooks (GitHub Actions) ────────────────────────────────
// Protected by x-cron-secret header. Never call these from the browser.
app.post("/api/v1/internal/cron/schedule", cronSchedule);
app.post("/api/v1/internal/cron/standings", cronStandings);
app.post("/api/v1/internal/cron/results", cronResults);
app.post("/api/v1/internal/cron/notifications", cronNotifications);

// ─── Global Error Handler ───────────────────────────────────────────────────
app.onError((err, c) => {
  console.error("Unhandled server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
