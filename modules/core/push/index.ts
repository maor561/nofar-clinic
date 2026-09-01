import webpush from "web-push";
import { eq } from "drizzle-orm";
import { getDb } from "@/modules/core/data/client";
import { pushSubscription } from "./schema";

/**
 * core/push (WP-65) — Web Push fan-out. Trusted infra (getDb-backed, like
 * core/notifications / core/email): every function takes an explicit `userId`
 * that the caller already resolved from a scoped handle.
 *
 * Degrades cleanly with no VAPID keys — `pushConfigured()` is false, the toggle
 * shows "unavailable", and `sendPushToUser` is a no-op.
 */

const PUBLIC_KEY = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
const SUBJECT = process.env.WEB_PUSH_SUBJECT || "mailto:support@example.com";

let configured = false;
if (PUBLIC_KEY && PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
    configured = true;
  } catch {
    configured = false;
  }
}

export function pushConfigured(): boolean {
  return configured;
}

/** The applicationServerKey the browser needs to subscribe. */
export function vapidPublicKey(): string | null {
  return configured ? (PUBLIC_KEY as string) : null;
}

export type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

/** Upsert by endpoint — re-subscribing or a new device just adds/updates a row. */
export async function savePushSubscription(
  userId: string,
  sub: BrowserSubscription,
  userAgent?: string | null,
): Promise<void> {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error("bad_subscription");
  await getDb()
    .insert(pushSubscription)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userAgent: userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscription.endpoint,
      set: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await getDb().delete(pushSubscription).where(eq(pushSubscription.endpoint, endpoint));
}

export async function hasPushSubscription(userId: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: pushSubscription.id })
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId))
    .limit(1);
  return rows.length > 0;
}

export type PushPayload = { title: string; body?: string; url?: string };

/**
 * Send a notification to every device the user registered. Best-effort: a
 * failed send never throws to the caller; a 404/410 prunes that dead row.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!configured) return;
  const db = getDb();
  const subs = await db.select().from(pushSubscription).where(eq(pushSubscription.userId, userId));
  if (subs.length === 0) return;

  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) {
          await db.delete(pushSubscription).where(eq(pushSubscription.id, s.id));
        }
      }
    }),
  );
}
