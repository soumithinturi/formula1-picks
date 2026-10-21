import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";

import { parseBody } from "../middleware/auth.ts";
import { ResultSubmissionSchema } from "../types/index.ts";
import { scoreRacePicks, completeRace, rowToSelections } from "../services/results.ts";
import { sendPushNotification } from "../services/pushService.ts";
import { fetchAndUpdateDriverStandings } from "../services/cron.ts";
import { TestNotificationSchema } from "../types/index.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * POST /api/v1/admin/results
 * Submits official race results, scores all picks across all leagues, and marks the race as COMPLETED.
 * Protected — ADMIN role required.
 */
export async function submitResults(c: AppContext) {
  const { data, error } = await parseBody(c, ResultSubmissionSchema);
  if (error) return error;

  const db = c.get("db");
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
      sprint_qualifying_p1 = COALESCE(EXCLUDED.sprint_qualifying_p1, race_results.sprint_qualifying_p1),
      sprint_p1 = COALESCE(EXCLUDED.sprint_p1, race_results.sprint_p1),
      sprint_p2 = COALESCE(EXCLUDED.sprint_p2, race_results.sprint_p2),
      sprint_p3 = COALESCE(EXCLUDED.sprint_p3, race_results.sprint_p3),
      race_qualifying_p1 = COALESCE(EXCLUDED.race_qualifying_p1, race_results.race_qualifying_p1),
      race_p1 = COALESCE(EXCLUDED.race_p1, race_results.race_p1),
      race_p2 = COALESCE(EXCLUDED.race_p2, race_results.race_p2),
      race_p3 = COALESCE(EXCLUDED.race_p3, race_results.race_p3),
      fastest_lap = COALESCE(EXCLUDED.fastest_lap, race_results.fastest_lap),
      first_dnf = COALESCE(EXCLUDED.first_dnf, race_results.first_dnf)
  `;

  // 2. Score every pick against the merged saved row (keeps quali/sprint data the cron saved)
  const [saved] = await db`SELECT * FROM race_results WHERE race_id = ${data.raceId}`;
  await scoreRacePicks(db, data.raceId, rowToSelections(saved));

  // 3. Mark completed and notify. Only the first submission notifies; later ones are corrections.
  const [race] = await db<{ name: string }[]>`SELECT name FROM races WHERE id = ${data.raceId}`;
  const raceName = race?.name ?? `Race #${data.raceId}`;
  await completeRace(
    db,
    data.raceId,
    `${raceName} — Results In! 🏁`,
    "The official results have been submitted. Check your score on the leaderboard."
  );

  // 7. Update Driver Standings
  await fetchAndUpdateDriverStandings(db).catch((err) => console.error("Standings update failed:", err));

  return c.json({ message: "Results processed successfully" });
}

/**
 * POST /api/v1/admin/notifications/test
 * Triggers a test push notification.
 * Protected — ADMIN role required.
 */
export async function testNotification(c: AppContext) {
  const { data, error } = await parseBody(c, TestNotificationSchema);
  if (error) return error;

  const db = c.get("db");
  const adminId = c.get("user").id;

  let subscriptions;
  if (data.broadcast) {
    subscriptions = await db`
      SELECT endpoint, p256dh, auth, id, user_id FROM user_push_subscriptions
    `;
  } else {
    subscriptions = await db`
      SELECT endpoint, p256dh, auth, id, user_id FROM user_push_subscriptions
      WHERE user_id = ${adminId}
    `;
  }

  if (subscriptions.length === 0) {
    return c.json({ error: "No active push subscriptions found for target" }, 404);
  }

  const payload = {
    title: data.title,
    body: data.body,
    url: data.metadata?.url || "/",
  };

  const targetUserIds = data.broadcast
    ? [...new Set(subscriptions.map((s: any) => s.user_id))]
    : [adminId];

  await Promise.all(targetUserIds.map(uid =>
    db`
      INSERT INTO notifications (user_id, type, title, body, metadata)
      VALUES (${uid}, ${data.type}, ${data.title}, ${data.body}, ${JSON.stringify(data.metadata || {})}::jsonb)
    `
  ));

  const results = await Promise.all(
    subscriptions.map(async (sub: any) => {
      const success = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      if (!success) {
        await db`DELETE FROM user_push_subscriptions WHERE id = ${sub.id}`;
        return { id: sub.id, success: false, reason: "410 Gone" };
      }
      return { id: sub.id, success: true };
    })
  );

  return c.json({
    message: `Attempted to send ${subscriptions.length} push notifications`,
    results,
  });
}
