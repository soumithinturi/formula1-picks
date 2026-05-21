import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";
import type { Sql } from "../db/index.ts";
import {
  fetchAndUpdateSchedule,
  fetchAndUpdateDriverStandings,
  fetchQualifyingResults,
  fetchRaceResults,
  checkUpcomingSessionsForNotifications,
} from "../services/cron.ts";
import { logger } from "../services/logger.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * Guards a cron webhook handler with a shared secret header check.
 * External Cron services (like GitHub Actions) include this header in every request.
 */
function withInternalSecret(
  jobName: string,
  handler: (db: Sql) => Promise<void>
) {
  return async (c: AppContext) => {
    const env = c.get("env");

    // Require the secret in production; allow open access in local dev
    if (env.NODE_ENV === "production") {
      if (!env.CRON_SECRET) {
        logger.error({ job: jobName }, "CRON_SECRET is not set — rejecting cron webhook");
        return c.json({ error: "Cron secret not configured" }, 500);
      }
      if (c.req.header("x-cron-secret") !== env.CRON_SECRET) {
        logger.warn({ job: jobName }, "Cron webhook received with invalid secret");
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    logger.info({ job: jobName }, `⚡ Cron webhook triggered: ${jobName}`);
    const start = Date.now();

    try {
      const db = c.get("db");
      await handler(db);
      const elapsed = Date.now() - start;
      logger.info({ job: jobName, elapsed }, `✅ Cron webhook completed: ${jobName} in ${elapsed}ms`);
      return c.json({ ok: true, job: jobName, elapsed });
    } catch (err) {
      logger.error({ err, job: jobName }, `Cron webhook failed: ${jobName}`);
      return c.json({ error: "Job failed", job: jobName }, 500);
    }
  };
}

/**
 * POST /api/v1/internal/cron/schedule
 * Syncs the season race schedule from the Ergast API.
 */
export const cronSchedule = withInternalSecret("schedule_sync", fetchAndUpdateSchedule);

/**
 * POST /api/v1/internal/cron/standings
 * Syncs driver standings from the Ergast API.
 */
export const cronStandings = withInternalSecret("standings_sync", fetchAndUpdateDriverStandings);

/**
 * POST /api/v1/internal/cron/results
 * Polls for qualifying + race results and triggers scoring.
 */
export const cronResults = withInternalSecret("results_polling", async (db) => {
  await fetchQualifyingResults(db);
  await fetchRaceResults(db);
});

/**
 * POST /api/v1/internal/cron/notifications
 * Checks upcoming sessions and dispatches push notifications.
 */
export const cronNotifications = withInternalSecret(
  "notifications_check",
  checkUpcomingSessionsForNotifications
);
