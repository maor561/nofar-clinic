import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { notification, type NotificationType } from "../schema";

export type NewNotification = {
  recipientUserId: string;
  therapistId: string;
  type: NotificationType;
  titleHe: string;
  bodyHe?: string;
  link?: string;
  meta?: Record<string, unknown>;
};

export async function createNotification(db: Db, n: NewNotification): Promise<{ id: string }> {
  const [row] = await db
    .insert(notification)
    .values({
      recipientUserId: n.recipientUserId,
      therapistId: n.therapistId,
      type: n.type,
      titleHe: n.titleHe,
      bodyHe: n.bodyHe ?? null,
      link: n.link ?? null,
      meta: n.meta ?? null,
    })
    .returning({ id: notification.id });
  return { id: row.id };
}

export async function markEmailed(db: Db, id: string): Promise<void> {
  await db.update(notification).set({ emailedAt: new Date() }).where(eq(notification.id, id));
}

/** The feed — always scoped to the recipient. */
export async function listNotifications(
  db: Db,
  recipientUserId: string,
  opts: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
) {
  const conds = [eq(notification.recipientUserId, recipientUserId)];
  if (opts.unreadOnly) conds.push(isNull(notification.readAt));
  return db
    .select()
    .from(notification)
    .where(and(...conds))
    .orderBy(desc(notification.createdAt))
    .limit(Math.min(opts.limit ?? 30, 100))
    .offset(opts.offset ?? 0);
}

export async function unreadCount(db: Db, recipientUserId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notification)
    .where(and(eq(notification.recipientUserId, recipientUserId), isNull(notification.readAt)));
  return rows[0]?.n ?? 0;
}

/** Mark specific ids (or all) read — only the recipient's own rows are touched. */
export async function markRead(db: Db, recipientUserId: string, ids?: string[]): Promise<number> {
  const conds = [eq(notification.recipientUserId, recipientUserId), isNull(notification.readAt)];
  if (ids && ids.length) conds.push(inArray(notification.id, ids));
  const updated = await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(...conds))
    .returning({ id: notification.id });
  return updated.length;
}
