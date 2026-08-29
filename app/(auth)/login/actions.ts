"use server";

import { redirect } from "next/navigation";
import { login } from "@/modules/core/auth";
import { writeSessionCookie, requestContext } from "@/modules/core/auth/server";
import { DbNotConfiguredError } from "@/modules/core/data/client";

export type LoginState = {
  error?: string;
  needsTotp?: boolean;
  email?: string;
};

function safeNext(raw: FormDataEntryValue | null): string | null {
  const v = typeof raw === "string" ? raw : "";
  return v === "/t" || v.startsWith("/t/") || v === "/p" || v.startsWith("/p/") ? v : null;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const totpRaw = String(formData.get("totpCode") ?? "").trim();
  const totpCode = totpRaw ? totpRaw : undefined;
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "יש למלא דוא״ל וסיסמה", email };
  }

  let result;
  try {
    result = await login({ email, password, totpCode }, await requestContext());
  } catch (e) {
    if (e instanceof DbNotConfiguredError) {
      return { error: "המערכת עדיין לא מחוברת למסד נתונים (יוגדר ב-WP-04).", email };
    }
    throw e;
  }

  switch (result.status) {
    case "ok":
      await writeSessionCookie(result.token, result.expiresAt);
      redirect(next ?? (result.role === "therapist" ? "/t" : "/p"));
    // redirect throws — no break needed
    case "totp_required":
      return { needsTotp: true, email };
    case "locked":
      return { error: "החשבון נעול זמנית עקב ריבוי ניסיונות. נסו שוב בעוד כ-15 דקות.", email };
    case "throttled":
      return { error: "יותר מדי ניסיונות מכתובת זו. נסו שוב בעוד כמה דקות.", email };
    case "invalid":
      return {
        error: totpCode ? "קוד האימות שגוי" : "דוא״ל או סיסמה שגויים",
        needsTotp: Boolean(totpCode),
        email,
      };
  }
}
