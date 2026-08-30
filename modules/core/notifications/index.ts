/**
 * core/notifications — in-app notification feed + badge. Critical types also
 * send an email via core/email (fail-open).
 */
import { getDb } from "@/modules/core/data/client";
import {
  listNotifications as _list,
  unreadCount as _unread,
  markRead as _markRead,
  type NewNotification,
} from "./internal/store";
import { notify as _notify, type NotifyInput } from "./internal/notify";

export type { NewNotification, NotifyInput };
export type { NotificationType } from "./schema";

export function notify(input: NotifyInput) {
  return _notify(getDb(), input);
}

export function listNotifications(
  recipientUserId: string,
  opts?: { unreadOnly?: boolean; limit?: number; offset?: number },
) {
  return _list(getDb(), recipientUserId, opts);
}

export function unreadCount(recipientUserId: string) {
  return _unread(getDb(), recipientUserId);
}

export function markRead(recipientUserId: string, ids?: string[]) {
  return _markRead(getDb(), recipientUserId, ids);
}
