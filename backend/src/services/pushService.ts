import webpush from "web-push";
import { db } from "../db/index.ts";

// VAPID keys should only be generated only once.
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

// Ensure keys are present
if (!vapidPublicKey || !vapidPrivateKey) {
  console.error("❌ VAPID keys are missing from environment variables!");
} else {
  console.log("✅ VAPID Public Key loaded:", vapidPublicKey.substring(0, 10) + "...");
  webpush.setVapidDetails(
    "mailto:your-email@example.com",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export const sendPushNotification = async (
  subscription: webpush.PushSubscription,
  payload: any
) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error("Error sending push notification", error);
    // You might want to handle 410 Gone errors here to remove invalid subscriptions
    if ((error as any).statusCode === 410) {
      // Return false to indicate the subscription is no longer valid
      return false;
    }
    throw error;
  }
  return true;
};

export const notifyLeagueJoin = async (leagueId: string, joinerId: string, joinerName: string) => {
  try {
    const [league] = await db`SELECT name FROM leagues WHERE id = ${leagueId} LIMIT 1`;
    if (!league) return;

    // Find subscriptions for all OTHER members of the league who have notify_league_joins enabled
    const subscriptions = await db`
      SELECT ups.endpoint, ups.p256dh, ups.auth, ups.id
      FROM league_members lm
      LEFT JOIN user_notification_settings uns ON lm.user_id = uns.user_id
      JOIN user_push_subscriptions ups ON lm.user_id = ups.user_id
      WHERE lm.league_id = ${leagueId}
        AND lm.user_id != ${joinerId}
        AND (uns.notify_league_joins IS NULL OR uns.notify_league_joins = true)
    `;

    const payload = {
      title: "New League Member",
      body: `${joinerName} just joined your league: ${league.name}!`
    };

    const promises = subscriptions.map((sub: any) => 
      sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).then(success => {
        if (!success) {
          // Remove invalid subscription
          return db`DELETE FROM user_push_subscriptions WHERE id = ${sub.id}`;
        }
      })
    );

    await Promise.all(promises);
  } catch (error) {
    console.error("Failed to notify league join", error);
  }
};
