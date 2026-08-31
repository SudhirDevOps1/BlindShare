import webPush from "web-push";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@blindshare.local";

let isVapidConfigured = false;

if (vapidPublicKey && vapidPrivateKey && !vapidPublicKey.includes("<") && !vapidPrivateKey.includes("<")) {
  try {
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    isVapidConfigured = true;
  } catch (e) {
    console.warn("VAPID details invalid, push notifications in mock/in-app mode:", e);
  }
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
): Promise<{ sent: number; failed: number }> {
  try {
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subs.length === 0) {
      return { sent: 0, failed: 0 };
    }

    if (!isVapidConfigured) {
      console.log(`[IN-APP NOTIFICATION SIMULATED for user ${userId}]`, payload);
      return { sent: subs.length, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const sub of subs) {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Expired subscription, clean up
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      }
    }

    return { sent, failed };
  } catch (err) {
    console.error("Failed to send push notifications:", err);
    return { sent: 0, failed: 0 };
  }
}
