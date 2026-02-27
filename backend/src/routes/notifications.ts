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
