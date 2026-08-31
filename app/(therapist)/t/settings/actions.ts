"use server";

import QRCode from "qrcode";
import { requireTherapist } from "@/modules/core/auth/server";
import { disconnect as disconnectGoogle } from "@/modules/calendar-sync";
import {
  changePassword,
  getAccountInfo,
  beginTotpEnrollment,
  confirmTotpEnrollment,
  passwordSchema,
} from "@/modules/core/auth";
import { revalidatePath } from "next/cache";

export type PwState = { error?: string; ok?: number };
export type TotpState = { error?: string; ok?: number };

export async function changePasswordAction(_prev: PwState, fd: FormData): Promise<PwState> {
  const session = await requireTherapist();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  if (!current) return { error: "יש להזין את הסיסמה הנוכחית" };
  if (next !== confirm) return { error: "הסיסמאות החדשות אינן תואמות" };
  const parsed = passwordSchema.safeParse(next);
  if (!parsed.success) return { error: "הסיסמה החדשה חייבת לכלול לפחות 10 תווים" };

  try {
    await changePassword(session.userId, current, next);
  } catch {
    return { error: "הסיסמה הנוכחית שגויה" };
  }
  return { ok: Date.now() };
}

/** Start enrollment — returns a QR data URL + base32 secret for the UI. */
export async function beginTotpAction(): Promise<
  { qr: string; secret: string } | { error: string }
> {
  const session = await requireTherapist();
  const acc = await getAccountInfo(session.userId);
  if (!acc) return { error: "החשבון לא נמצא" };
  if (acc.totpEnabled) return { error: "אימות דו־שלבי כבר פעיל" };
  const { uri, secret } = await beginTotpEnrollment(session.userId, acc.email);
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 180 });
  return { qr, secret };
}

export async function confirmTotpAction(
  secret: string,
  _prev: TotpState,
  fd: FormData,
): Promise<TotpState> {
  const session = await requireTherapist();
  const acc = await getAccountInfo(session.userId);
  if (!acc) return { error: "החשבון לא נמצא" };

  const code = String(fd.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "יש להזין קוד בן 6 ספרות" };

  const okConfirm = await confirmTotpEnrollment(session.userId, acc.email, secret, code);
  if (!okConfirm) return { error: "הקוד שגוי או שפג. נסו שוב." };

  revalidatePath("/t/settings");
  return { ok: Date.now() };
}

/** Drop the stored Google Calendar connection. */
export async function disconnectGoogleAction(): Promise<void> {
  const session = await requireTherapist();
  await disconnectGoogle(session.therapistId);
  revalidatePath("/t/settings");
}
