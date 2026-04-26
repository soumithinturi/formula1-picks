import {
  fetchAndUpdateSchedule,
  fetchAndUpdateDriverStandings,
  fetchQualifyingResults,
  fetchRaceResults,
  checkUpcomingSessionsForNotifications,
} from "../services/cron.ts";
import { logger } from "../services/logger.ts";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Guards a cron webhook handler with a shared secret header check.
 * External Cron services (like GitHub Actions) include this header in every request.
 * Set CRON_SECRET in the environment variables and in the Cron service configuration.
 */
function withInternalSecret(
  jobName: string,
  handler: () => Promise<void>
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    // Require the secret in production; allow open access in local dev
    if (process.env.NODE_ENV === "production") {
      if (!CRON_SECRET) {
        logger.error({ job: jobName }, "CRON_SECRET is not set — rejecting cron webhook");
        return Response.json({ error: "Cron secret not configured" }, { status: 500 });
      }
      if (req.headers.get("x-cron-secret") !== CRON_SECRET) {
        logger.warn({ job: jobName }, "Cron webhook received with invalid secret");
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    logger.info({ job: jobName }, `⚡ Cron webhook triggered: ${jobName}`);
    const start = Date.now();

    try {
      await handler();
      const elapsed = Date.now() - start;
      logger.info({ job: jobName, elapsed }, `✅ Cron webhook completed: ${jobName} in ${elapsed}ms`);
      return Response.json({ ok: true, job: jobName, elapsed });
    } catch (err) {
      logger.error({ err, job: jobName }, `Cron webhook failed: ${jobName}`);
      return Response.json({ error: "Job failed", job: jobName }, { status: 500 });
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
export const cronResults = withInternalSecret("results_polling", async () => {
  await fetchQualifyingResults();
  await fetchRaceResults();
});

/**
 * POST /api/v1/internal/cron/notifications
 * Checks upcoming sessions and dispatches push notifications.
 */
export const cronNotifications = withInternalSecret(
  "notifications_check",
  checkUpcomingSessionsForNotifications
);
