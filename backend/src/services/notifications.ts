import { db } from "../db/index.ts";
import type { NotificationType } from "../types/index.ts";

/**
 * Insert a single notification for a user.
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await db`
    INSERT INTO notifications (user_id, type, title, body, metadata)
    VALUES (${userId}, ${type}, ${title}, ${body}, ${JSON.stringify(metadata)})
  `;
}

/**
 * Fan out a notification to every user who submitted a pick for the given race
 * (across all leagues). Runs inserts in parallel.
 */
export async function createNotificationsForAllPicksInRace(
  raceId: number,
  type: NotificationType,
  title: string,
  body: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  // Collect distinct user IDs who picked on this race
  const rows = await db<{ user_id: string }[]>`
    SELECT DISTINCT user_id FROM picks WHERE race_id = ${raceId}
  `;

  if (rows.length === 0) return;

  await Promise.all(
    rows.map((r) => createNotification(r.user_id, type, title, body, metadata))
  );
}
