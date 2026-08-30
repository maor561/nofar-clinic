import { Resend } from "resend";

/**
 * Transactional email via Resend. Fail-open: a send failure is logged and
 * returned, never thrown — an email problem must not break the user's flow
 * (ADR-007 / ADR-020). A missing API key ⇒ the message is logged, not sent
 * (local dev without Resend).
 */

const FROM = process.env.EMAIL_FROM ?? "נופר כהן <nofar@nofar-health.com>";

let client: Resend | null = null;
function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export type SendResult = { ok: boolean; id?: string; error?: string; skipped?: boolean };

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail(msg: OutgoingEmail): Promise<SendResult> {
  const r = resend();
  if (!r) {
    console.warn(`[email] RESEND_API_KEY unset — not sending "${msg.subject}" to ${msg.to}`);
    return { ok: false, skipped: true };
  }
  try {
    const { data, error } = await r.emails.send({
      from: FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      replyTo: msg.replyTo,
    });
    if (error) {
      console.error(`[email] send failed to ${msg.to}: ${error.name} ${error.message}`);
      return { ok: false, error: `${error.name}: ${error.message}` };
    }
    return { ok: true, id: data?.id };
  } catch (e) {
    console.error(`[email] send threw for ${msg.to}`, e);
    return { ok: false, error: (e as Error).message };
  }
}
