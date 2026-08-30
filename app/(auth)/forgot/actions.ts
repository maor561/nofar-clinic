"use server";

import { startPasswordReset } from "@/modules/core/auth";
import { requestContext } from "@/modules/core/auth/server";
import { sendPasswordResetEmail } from "@/modules/core/email";
import { DbNotConfiguredError } from "@/modules/core/authz";

export type ForgotState = { sent?: boolean; error?: string };

export async function requestResetAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "יש להזין דוא״ל" };

  try {
    const { ip } = await requestContext();
    const result = await startPasswordReset(email, ip);
    if (result) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] password reset link: /reset/${result.token}`);
      }
      // fail-open: a mail failure must not change the response or fail the flow
      await sendPasswordResetEmail(email, { token: result.token });
    }
  } catch (e) {
    if (!(e instanceof DbNotConfiguredError)) throw e;
  }

  // Always the same response — no account enumeration.
  return { sent: true };
}
