import { db } from "../db/index.ts";
import { withAdmin, parseBody } from "../middleware/auth.ts";
import { ResultSubmissionSchema, type PickRow, type LeagueRow, type ScoringConfig } from "../types/index.ts";
import { calculatePoints } from "../services/scoring.ts";
import { createNotificationsForAllPicksInRace } from "../services/notifications.ts";
import { sendPushNotification } from "../services/pushService.ts";
import { TestNotificationSchema } from "../types/index.ts";

/**
 * POST /api/v1/admin/results
 * Submits official race results, scores all picks across all leagues, and marks the race as COMPLETED.
 * Protected — ADMIN role required.
 */
export const submitResults = withAdmin(async (req) => {
  const { data, error } = await parseBody(req, ResultSubmissionSchema);
  if (error) return error;

  const results = data.results;

  // 1. Save the official results
  await db`
    INSERT INTO race_results (
      race_id,
      sprint_qualifying_p1, sprint_p1, sprint_p2, sprint_p3,
      race_qualifying_p1, race_p1, race_p2, race_p3,
      fastest_lap, first_dnf
    ) VALUES (
      ${data.raceId},
      ${results.sprintQualifyingP1 ?? null}, ${results.sprintP1 ?? null},
      ${results.sprintP2 ?? null}, ${results.sprintP3 ?? null},
      ${results.raceQualifyingP1 ?? null}, ${results.raceP1 ?? null},
      ${results.raceP2 ?? null}, ${results.raceP3 ?? null},
      ${results.fastestLap ?? null}, ${results.firstDnf ?? null}
    )
    ON CONFLICT (race_id) DO UPDATE SET
      sprint_qualifying_p1 = EXCLUDED.sprint_qualifying_p1,
      sprint_p1 = EXCLUDED.sprint_p1,
      sprint_p2 = EXCLUDED.sprint_p2,
      sprint_p3 = EXCLUDED.sprint_p3,
      race_qualifying_p1 = EXCLUDED.race_qualifying_p1,
      race_p1 = EXCLUDED.race_p1,
      race_p2 = EXCLUDED.race_p2,
      race_p3 = EXCLUDED.race_p3,
      fastest_lap = EXCLUDED.fastest_lap,
      first_dnf = EXCLUDED.first_dnf
  `;

  // 2. Fetch all picks for this race (across all leagues)
  const picks = await db<PickRow[]>`
    SELECT * FROM picks WHERE race_id = ${data.raceId}
  `;

  // 3. Fetch all leagues to get their scoring configs
  const leagues = await db<LeagueRow[]>`
    SELECT id, scoring_config FROM leagues
  `;
  const leagueConfigMap = new Map<string, ScoringConfig>(
    leagues.map((l) => [l.id, l.scoring_config])
  );

  // 4. Score each pick using its league's scoring config
  // Run updates in parallel for performance
  await Promise.all(
    picks.map((pick) => {
      let config = leagueConfigMap.get(pick.league_id);
      if (typeof config === "string") {
        config = JSON.parse(config);
      }
      const userPick = {
        sprintQualifyingP1: pick.sprint_qualifying_p1,
        sprintP1: pick.sprint_p1,
        sprintP2: pick.sprint_p2,
        sprintP3: pick.sprint_p3,
        sprintFastestLap: pick.sprint_fastest_lap,
        raceQualifyingP1: pick.race_qualifying_p1,
        raceP1: pick.race_p1,
        raceP2: pick.race_p2,
        raceP3: pick.race_p3,
        fastestLap: pick.fastest_lap,
        firstDnf: pick.first_dnf,
      };
      const points = calculatePoints(userPick, results, config);

      return db`
        UPDATE picks
        SET total_points = ${points.score},
            correct_predictions = ${points.correct},
            total_predictions = ${points.total}
        WHERE id = ${pick.id}
      `;
    })
  );

  // 5. Fan out in-app notifications to all users who picked on this race
  const [race] = await db<{ name: string }[]>`SELECT name FROM races WHERE id = ${data.raceId}`;
  const raceName = race?.name ?? `Race #${data.raceId}`;
  await createNotificationsForAllPicksInRace(
    data.raceId,
    "RESULTS_IN",
    `${raceName} — Results In! 🏁`,
    "The official results have been submitted. Check your score on the leaderboard.",
    { raceId: data.raceId }
  );

  // 6. Mark race as completed
  await db`
    UPDATE races SET status = 'COMPLETED' WHERE id = ${data.raceId}
  `;

  return Response.json({ message: "Results processed successfully" });
});

/**
 * POST /api/v1/admin/notifications/test
 * Triggers a test push notification.
 * Protected — ADMIN role required.
 */
export const testNotification = withAdmin(async (req) => {
  const { data, error } = await parseBody(req, TestNotificationSchema);
  if (error) return error;

  const adminId = (req as any).user.id;

  let subscriptions;
  if (data.broadcast) {
    // Fetch all non-expired push subscriptions
    subscriptions = await db`
      SELECT endpoint, p256dh, auth, id, user_id FROM user_push_subscriptions
    `;
  } else {
    // Only send to the admin's own devices for testing
    subscriptions = await db`
      SELECT endpoint, p256dh, auth, id, user_id FROM user_push_subscriptions
      WHERE user_id = ${adminId}
    `;
  }

  if (subscriptions.length === 0) {
    return Response.json({ error: "No active push subscriptions found for target" }, { status: 404 });
  }

  const payload = {
    title: data.title,
    body: data.body,
    url: data.metadata?.url || "/",
  };

  // Also create an in-app notification record for the admin (and others if broadcast)
  // for better visibility in the UI "Notifications" section.
  const targetUserIds = data.broadcast 
    ? [...new Set(subscriptions.map((s: any) => s.user_id))] // This is tricky as we don't have user_id in the SELECT prompt above, let's fix the SELECT
    : [adminId];

  // Re-fetch subscriptions with user_id if we want to do broadcast DB records, 
  // but for now let's just ensure the admin gets the record.
  await Promise.all(targetUserIds.map(uid => 
    db`
      INSERT INTO notifications (user_id, type, title, body, metadata)
      VALUES (${uid}, ${data.type}, ${data.title}, ${data.body}, ${data.metadata || {}})
    `
  ));

  const results = await Promise.all(
    subscriptions.map(async (sub: any) => {
      const success = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      if (!success) {
        // Remove invalid subscription
        await db`DELETE FROM user_push_subscriptions WHERE id = ${sub.id}`;
        return { id: sub.id, success: false, reason: "410 Gone" };
      }
      return { id: sub.id, success: true };
    })
  );

  return Response.json({
    message: `Attempted to send ${subscriptions.length} push notifications`,
    results,
  });
});
