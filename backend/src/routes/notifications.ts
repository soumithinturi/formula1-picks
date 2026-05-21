import type { Context } from "hono";
import type { Bindings, Variables } from "../types/env.ts";

import type { NotificationRow } from "../types/index.ts";

type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

/**
 * GET /api/v1/notifications
 * Returns the authenticated user's 30 most recent notifications
 * plus a total unread count.
 */
export async function listNotifications(c: AppContext) {
  const db = c.get("db");
  const userId = c.get("user").id;

  const notifications = await db<NotificationRow[]>`
    SELECT id, type, title, body, metadata, is_read, created_at
    FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 30
  `;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return c.json({ notifications, unreadCount });
}

/**
 * PUT /api/v1/notifications/read
 * Marks all of the authenticated user's notifications as read.
 */
export async function markAllRead(c: AppContext) {
  const db = c.get("db");
  const userId = c.get("user").id;

  const result = await db`
    UPDATE notifications
    SET is_read = true
    WHERE user_id = ${userId} AND is_read = false
    RETURNING id
  `;

  return c.json({ updated: result.length });
}

/**
 * POST /api/v1/notifications/subscribe
 * Saves a user's web PushSubscription
 */
export async function subscribePush(c: AppContext) {
  const db = c.get("db");
  const userId = c.get("user").id;

  const subscription = await c.req.json() as any;

  if (!subscription || !subscription.endpoint) {
    return c.json({ error: "Invalid subscription payload" }, 400);
  }

  await db`
    INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (
      ${userId}, 
      ${subscription.endpoint}, 
      ${subscription.keys.p256dh}, 
      ${subscription.keys.auth}
    )
    ON CONFLICT (endpoint) DO UPDATE 
    SET user_id = EXCLUDED.user_id, updated_at = now()
  `;

  return c.json({ success: true });
}

/**
 * DELETE /api/v1/notifications/unsubscribe
 */
export async function unsubscribePush(c: AppContext) {
  const db = c.get("db");
  const userId = c.get("user").id;

  const body = await c.req.json() as { endpoint: string };
  const { endpoint } = body;

  if (!endpoint) {
    return c.json({ error: "Missing endpoint" }, 400);
  }

  await db`
    DELETE FROM user_push_subscriptions
    WHERE user_id = ${userId} AND endpoint = ${endpoint}
  `;

  return c.json({ success: true });
}

/**
 * GET /api/v1/notifications/settings
 * Fetch notification settings for user
 */
export async function getNotificationSettings(c: AppContext) {
  const db = c.get("db");
  const userId = c.get("user").id;

  const settingsList = await db`
    SELECT notify_league_joins, notify_sprint_quali_cadence, 
           notify_sprint_cadence, notify_race_quali_cadence, notify_race_cadence
    FROM user_notification_settings
    WHERE user_id = ${userId}
  `;

  if (settingsList.length === 0) {
    return c.json({
      notify_league_joins: true,
      notify_sprint_quali_cadence: null,
      notify_sprint_cadence: null,
      notify_race_quali_cadence: null,
      notify_race_cadence: null,
    });
  }

  return c.json(settingsList[0]);
}

/**
 * PUT /api/v1/notifications/settings
 * Update notification settings for user
 */
export async function updateNotificationSettings(c: AppContext) {
  const db = c.get("db");
  const userId = c.get("user").id;

  const settings = await c.req.json() as any;

  await db`
    INSERT INTO user_notification_settings (
      user_id, 
      notify_league_joins, 
      notify_sprint_quali_cadence, 
      notify_sprint_cadence, 
      notify_race_quali_cadence, 
      notify_race_cadence
    )
    VALUES (
      ${userId}, 
      ${settings.notify_league_joins ?? true}, 
      ${settings.notify_sprint_quali_cadence ?? null}, 
      ${settings.notify_sprint_cadence ?? null}, 
      ${settings.notify_race_quali_cadence ?? null}, 
      ${settings.notify_race_cadence ?? null}
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET 
      notify_league_joins = EXCLUDED.notify_league_joins,
      notify_sprint_quali_cadence = EXCLUDED.notify_sprint_quali_cadence,
      notify_sprint_cadence = EXCLUDED.notify_sprint_cadence,
      notify_race_quali_cadence = EXCLUDED.notify_race_quali_cadence,
      notify_race_cadence = EXCLUDED.notify_race_cadence,
      updated_at = now()
  `;

  return c.json({ success: true });
}
