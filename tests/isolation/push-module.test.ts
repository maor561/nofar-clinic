// @vitest-environment node
/**
 * core/push (WP-65) — subscriptions are keyed by endpoint and scoped to a user.
 * With no VAPID env in the test run, `sendPushToUser` is a safe no-op.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { user, therapist } from "@/modules/core/auth/schema";
import { pushSubscription } from "@/modules/core/push/schema";
import {
  savePushSubscription,
  deletePushSubscription,
  hasPushSubscription,
  sendPushToUser,
} from "@/modules/core/push";

let db: Db;
let u1: string;
let u2: string;

const sub = (endpoint: string) => ({
  endpoint,
  keys: { p256dh: "p256dh-key", auth: "auth-key" },
});

beforeEach(async () => {
  db = await createTestDb();
  const [t] = await db
    .insert(therapist)
    .values({ name: "נופר", email: "n@ex.co" })
    .returning({ id: therapist.id });
  [u1, u2] = (
    await db
      .insert(user)
      .values([
        { email: "a@ex.co", passwordHash: "x", role: "therapist", therapistId: t.id },
        { email: "b@ex.co", passwordHash: "x", role: "patient", therapistId: t.id },
      ])
      .returning({ id: user.id })
  ).map((r) => r.id);
});

describe("push subscriptions", () => {
  it("saves, reports, and removes a subscription per user", async () => {
    expect(await hasPushSubscription(u1)).toBe(false);
    await savePushSubscription(u1, sub("https://push.example/a"), "UA/1");
    expect(await hasPushSubscription(u1)).toBe(true);
    expect(await hasPushSubscription(u2)).toBe(false);

    await deletePushSubscription("https://push.example/a");
    expect(await hasPushSubscription(u1)).toBe(false);
  });

  it("upserts by endpoint — re-subscribing updates keys, doesn't duplicate", async () => {
    await savePushSubscription(u1, sub("https://push.example/same"));
    await savePushSubscription(u1, {
      endpoint: "https://push.example/same",
      keys: { p256dh: "new-p256dh", auth: "new-auth" },
    });
    const rows = await db
      .select()
      .from(pushSubscription)
      .where(eq(pushSubscription.endpoint, "https://push.example/same"));
    expect(rows).toHaveLength(1);
    expect(rows[0].p256dh).toBe("new-p256dh");
  });

  it("an endpoint can move to another user (same device, new login)", async () => {
    await savePushSubscription(u1, sub("https://push.example/x"));
    await savePushSubscription(u2, sub("https://push.example/x"));
    expect(await hasPushSubscription(u1)).toBe(false);
    expect(await hasPushSubscription(u2)).toBe(true);
  });

  it("rejects a malformed subscription", async () => {
    await expect(
      savePushSubscription(u1, { endpoint: "", keys: { p256dh: "", auth: "" } }),
    ).rejects.toThrow("bad_subscription");
  });

  it("sendPushToUser never throws to the caller (best-effort fan-out)", async () => {
    await savePushSubscription(u1, sub("https://push.example/z"));
    await expect(sendPushToUser(u1, { title: "hi", url: "/" })).resolves.toBeUndefined();
    await expect(sendPushToUser(u2, { title: "x" })).resolves.toBeUndefined(); // no subs
  });
});
