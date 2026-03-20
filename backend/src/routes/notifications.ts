import { db } from "../db/index.ts";
import { withAuth } from "../middleware/auth.ts";
import type { AuthedRequest } from "../middleware/auth.ts";
import type { NotificationRow } from "../types/index.ts";

/**
 * GET /api/v1/notifications
 * Returns the authenticated user's 30 most recent notifications
 * plus a total unread count.
 */
export const listNotifications = withAuth(async (req: AuthedRequest) => {
  const notifications = await db<NotificationRow[]>`
    SELECT id, type, title, body, metadata, is_read, created_at
    FROM notifications
    WHERE user_id = ${req.user.id}
    ORDER BY created_at DESC
    LIMIT 30
  `;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return Response.json({ notifications, unreadCount });
});

/**
 * PUT /api/v1/notifications/read
 * Marks all of the authenticated user's notifications as read.
 */
export const markAllRead = withAuth(async (req: AuthedRequest) => {
  const result = await db`
    UPDATE notifications
    SET is_read = true
    WHERE user_id = ${req.user.id} AND is_read = false
    RETURNING id
  `;

  return Response.json({ updated: result.length });
});

/**
 * POST /api/v1/notifications/subscribe
 * Saves a user's web PushSubscription
 */
export const subscribePush = withAuth(async (req: AuthedRequest) => {
  const subscription = await req.json() as any;

  if (!subscription || !subscription.endpoint) {
    return Response.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  // Insert or update subscription
  await db`
    INSERT INTO user_push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (
      ${req.user.id}, 
      ${subscription.endpoint}, 
      ${subscription.keys.p256dh}, 
      ${subscription.keys.auth}
    )
    ON CONFLICT (endpoint) DO UPDATE 
    SET user_id = EXCLUDED.user_id, updated_at = now()
  `;

  return Response.json({ success: true });
});

/**
 * DELETE /api/v1/notifications/unsubscribe
 */
export const unsubscribePush = withAuth(async (req: AuthedRequest) => {
  const body = await req.json() as { endpoint: string };
  const { endpoint } = body;

  if (!endpoint) {
    return Response.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await db`
    DELETE FROM user_push_subscriptions
    WHERE user_id = ${req.user.id} AND endpoint = ${endpoint}
  `;

  return Response.json({ success: true });
});

/**
 * GET /api/v1/notifications/settings
 * Fetch notification settings for user
 */
export const getNotificationSettings = withAuth(async (req: AuthedRequest) => {
  const settingsList = await db`
    SELECT notify_league_joins, notify_sprint_quali_cadence, 
           notify_sprint_cadence, notify_race_quali_cadence, notify_race_cadence
    FROM user_notification_settings
    WHERE user_id = ${req.user.id}
  `;

  if (settingsList.length === 0) {
    // Default settings
    return Response.json({
      notify_league_joins: true,
      notify_sprint_quali_cadence: null,
      notify_sprint_cadence: null,
      notify_race_quali_cadence: null,
      notify_race_cadence: null,
    });
  }

  return Response.json(settingsList[0]);
});

/**
 * PUT /api/v1/notifications/settings
 * Update notification settings for user
 */
export const updateNotificationSettings = withAuth(async (req: AuthedRequest) => {
  const settings = await req.json() as any;

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
      ${req.user.id}, 
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

  return Response.json({ success: true });
});
