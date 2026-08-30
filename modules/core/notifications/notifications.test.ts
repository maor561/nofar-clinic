// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { therapist, user } from "@/modules/core/auth/schema";
import { notification } from "./schema";
import { createNotification, listNotifications, unreadCount, markRead } from "./internal/store";
import { notify } from "./internal/notify";
import { sendEmail } from "@/modules/core/email/internal/client";

vi.mock("@/modules/core/email/internal/client", () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true, id: "mock" }),
}));

let db: Db;
let t1: string;
let uA: string;
let uB: string;

async function mkUser(email: string, role: "therapist" | "patient", therapistId: string) {
  const [u] = await db
    .insert(user)
    .values({ role, email, status: "active", therapistId, passwordHash: "x" })
    .returning({ id: user.id });
  return u.id;
}

beforeEach(async () => {
  vi.mocked(sendEmail).mockClear();
  db = await createTestDb();
  const [t] = await db
    .insert(therapist)
    .values({ name: "נופר", email: "n@ex.co" })
    .returning({ id: therapist.id });
  t1 = t.id;
  uA = await mkUser("a@ex.co", "therapist", t1);
  uB = await mkUser("b@ex.co", "patient", t1);
});

describe("feed + badge", () => {
  it("creates, lists newest-first, counts unread, marks read", async () => {
    await createNotification(db, {
      recipientUserId: uA,
      therapistId: t1,
      type: "generic",
      titleHe: "אחת",
    });
    const { id: second } = await createNotification(db, {
      recipientUserId: uA,
      therapistId: t1,
      type: "patient_joined",
      titleHe: "שתיים",
    });

    const feed = await listNotifications(db, uA);
    expect(feed.map((n) => n.titleHe)).toEqual(["שתיים", "אחת"]);
    expect(await unreadCount(db, uA)).toBe(2);

    expect(await markRead(db, uA, [second])).toBe(1);
    expect(await unreadCount(db, uA)).toBe(1);
    expect((await listNotifications(db, uA, { unreadOnly: true })).map((n) => n.titleHe)).toEqual([
      "אחת",
    ]);

    expect(await markRead(db, uA)).toBe(1); // mark all
    expect(await unreadCount(db, uA)).toBe(0);
  });

  it("is scoped to the recipient — B cannot see or mark A's", async () => {
    await createNotification(db, {
      recipientUserId: uA,
      therapistId: t1,
      type: "generic",
      titleHe: "של A",
    });
    expect(await listNotifications(db, uB)).toHaveLength(0);
    expect(await unreadCount(db, uB)).toBe(0);
    expect(await markRead(db, uB)).toBe(0);
    expect(await unreadCount(db, uA)).toBe(1); // untouched
  });
});

describe("notify() + critical email", () => {
  it("critical type sends an email and stamps emailed_at", async () => {
    const { id } = await notify(db, {
      recipientUserId: uB,
      therapistId: t1,
      type: "password_changed",
      titleHe: "הסיסמה שונתה",
    });

    expect(vi.mocked(sendEmail)).toHaveBeenCalledOnce();
    expect(vi.mocked(sendEmail).mock.calls[0][0].to).toBe("b@ex.co");
    const row = (await db.select().from(notification).where(eq(notification.id, id)))[0];
    expect(row.emailedAt).not.toBeNull();
  });

  it("non-critical type does not email", async () => {
    await notify(db, {
      recipientUserId: uA,
      therapistId: t1,
      type: "patient_joined",
      titleHe: "x",
    });
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });
});
