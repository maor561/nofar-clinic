/**
 * core/email — transactional email (Resend). Fail-open (ADR-020): a send failure
 * is logged and returned, never thrown.
 */
import { sendEmail, type SendResult } from "./internal/client";
import {
  inviteEmail,
  passwordResetEmail,
  upcomingAppointmentEmail,
  planChangedEmail,
} from "./internal/templates";

export type { SendResult };
export {
  inviteEmail,
  passwordResetEmail,
  upcomingAppointmentEmail,
  planChangedEmail,
} from "./internal/templates";

/** Absolute app URL for links in emails. */
export function appUrl(path: string): string {
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function sendInviteEmail(
  to: string,
  opts: { token: string; patientName?: string },
): Promise<SendResult> {
  const t = inviteEmail({
    inviteUrl: appUrl(`/invite/${opts.token}`),
    patientName: opts.patientName,
  });
  return sendEmail({ to, ...t });
}

export function sendPasswordResetEmail(to: string, opts: { token: string }): Promise<SendResult> {
  const t = passwordResetEmail({ resetUrl: appUrl(`/reset/${opts.token}`) });
  return sendEmail({ to, ...t });
}

export function sendUpcomingAppointmentEmail(
  to: string,
  opts: { patientName?: string; when: string; treatmentType: string },
): Promise<SendResult> {
  return sendEmail({ to, ...upcomingAppointmentEmail(opts) });
}

export function sendPlanChangedEmail(
  to: string,
  opts: { patientName?: string; versionNote?: string; planPath?: string },
): Promise<SendResult> {
  const t = planChangedEmail({
    patientName: opts.patientName,
    versionNote: opts.versionNote,
    planUrl: appUrl(opts.planPath ?? "/p/plan"),
  });
  return sendEmail({ to, ...t });
}
