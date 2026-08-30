import "server-only";
import { getCurrentSession } from "@/modules/core/auth/server";
import { listNotifications, unreadCount, markRead } from "./index";

/** Current-session helpers for the feed / badge / route handler. */

export async function myNotifications(opts?: { unreadOnly?: boolean; limit?: number }) {
  const s = await getCurrentSession();
  if (!s) return [];
  return listNotifications(s.userId, opts);
}

export async function myUnreadCount(): Promise<number> {
  const s = await getCurrentSession();
  if (!s) return 0;
  return unreadCount(s.userId);
}

export async function markMineRead(ids?: string[]): Promise<number> {
  const s = await getCurrentSession();
  if (!s) return 0;
  return markRead(s.userId, ids);
}
