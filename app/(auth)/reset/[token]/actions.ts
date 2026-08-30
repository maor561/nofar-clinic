"use server";

import { redirect } from "next/navigation";
import { completePasswordReset, passwordSchema } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { DbNotConfiguredError } from "@/modules/core/authz";

export type ResetState = { error?: string };

export async function completeResetAction(
  token: string,
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "סיסמה לא תקינה" };
  if (password !== confirm) return { error: "הסיסמאות אינן תואמות" };

  let userId: string;
  let therapistId: string;
  try {
    ({ userId, therapistId } = await completePasswordReset(token, password));
  } catch (e) {
    if (e instanceof DbNotConfiguredError) {
      return { error: "המערכת עדיין לא מחוברת למסד נתונים (יוגדר ב-WP-04)." };
    }
    return { error: "קישור האיפוס אינו תקף או שפג תוקפו. בקשו קישור חדש." };
  }

  // security notice — critical type, also emailed
  await notify({
    recipientUserId: userId,
    therapistId,
    type: "password_changed",
    titleHe: "הסיסמה שלך שונתה",
    bodyHe: "אם לא ביקשת לשנות את הסיסמה — פנה/י לנופר בהקדם.",
  });

  redirect("/login?reset=1");
}
