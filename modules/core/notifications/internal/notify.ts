import { eq } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { user } from "@/modules/core/auth/schema";
import { sendEmail } from "@/modules/core/email/internal/client";
import { sendPushToUser } from "@/modules/core/push";
import { createNotification, markEmailed, type NewNotification } from "./store";

/** Types that also send an email. */
const CRITICAL = new Set<NewNotification["type"]>([
  "password_changed",
  "appointment_upcoming",
  "plan_changed",
]);

export type NotifyInput = NewNotification & {
  /** override: force / suppress the email regardless of type */
  email?: boolean;
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
};

/**
 * Create an in-app notification and, for critical types (or when `email: true`),
 * also send an email and stamp `emailed_at`. Email is fail-open — a send failure
 * never fails the notification.
 */
export async function notify(db: Db, input: NotifyInput): Promise<{ id: string }> {
  const { id } = await createNotification(db, input);

  // Web Push (WP-65) — best-effort, never blocks or fails the notification.
  void sendPushToUser(input.recipientUserId, {
    title: input.titleHe,
    body: input.bodyHe ?? undefined,
    url: input.link ?? "/",
  }).catch(() => {});

  const wantsEmail = input.email ?? CRITICAL.has(input.type);
  if (wantsEmail) {
    const rows = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, input.recipientUserId))
      .limit(1);
    const to = rows[0]?.email;
    if (to) {
      const r = await sendEmail({
        to,
        subject: input.emailSubject ?? input.titleHe,
        html:
          input.emailHtml ??
          `<div dir="rtl" lang="he" style="font-family:Arial,sans-serif"><p><b>${input.titleHe}</b></p>${
            input.bodyHe ? `<p>${input.bodyHe}</p>` : ""
          }</div>`,
        text: input.emailText ?? `${input.titleHe}${input.bodyHe ? `\n${input.bodyHe}` : ""}`,
      });
      if (r.ok) await markEmailed(db, id);
    }
  }
  return { id };
}
