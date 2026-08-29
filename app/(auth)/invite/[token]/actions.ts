"use server";

import { redirect } from "next/navigation";
import { acceptInvite, createSession, passwordSchema } from "@/modules/core/auth";
import { writeSessionCookie, requestContext } from "@/modules/core/auth/server";
import { DbNotConfiguredError } from "@/modules/core/data/client";

export type InviteState = { error?: string };

export async function acceptInviteAction(
  token: string,
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "סיסמה לא תקינה" };
  }
  if (password !== confirm) {
    return { error: "הסיסמאות אינן תואמות" };
  }

  let userId: string;
  try {
    ({ userId } = await acceptInvite(token, password));
  } catch (e) {
    if (e instanceof DbNotConfiguredError) {
      return { error: "המערכת עדיין לא מחוברת למסד נתונים (יוגדר ב-WP-04)." };
    }
    return { error: "קישור ההזמנה אינו תקף או שכבר נעשה בו שימוש." };
  }

  const { token: sessionToken, expiresAt } = await createSession(userId, await requestContext());
  await writeSessionCookie(sessionToken, expiresAt);
  redirect("/p");
}
