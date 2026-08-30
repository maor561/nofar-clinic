# core/notifications

In-app notification feed + unread badge. ADR-021 / DATA_MODEL#notification.
Critical types also email (core/email, fail-open).

## Sending

```ts
import { notify } from "@/modules/core/notifications";

await notify({
  recipientUserId,          // the user who sees it (auth.user.id)
  therapistId,
  type: "patient_joined",   // schema.notificationType
  titleHe: "מטופל/ת חדש/ה הצטרף/ה",
  bodyHe: "…",              // optional
  link: "/t/patients",      // optional — the row is a link
});
```

Critical types (`password_changed`, `appointment_upcoming`, `plan_changed`) also
send an email and stamp `emailed_at`. Pass `email: true` to force it for any type.

## Reading

`server.ts`: `myNotifications({unreadOnly?, limit?})`, `myUnreadCount()`,
`markMineRead(ids?)` — all scoped to the current session's user. The store
functions (`listNotifications` / `unreadCount` / `markRead`) are always scoped to
`recipient_user_id`; a user can never read or mark another user's rows.

## UI

- `<NotificationBell/>` — in both shell headers. Polls `GET /api/notifications`
  every 30s (count + recent 15), popover feed, "mark all read".
- `/t/alerts` — full list for the therapist.

## Wired triggers

- invite accepted → `patient_joined` to the therapist
- password reset completed → `password_changed` to the user (+ email)

More arrive with the domain modules (appointments WP-12, plans WP-14, tasks
WP-15, messaging WP-16).
