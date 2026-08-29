import type { Db } from "@/modules/core/data/client";
import { verifyPassword } from "./password";
import { verifyTotpCode } from "./totp";
import { getUserByEmail } from "./register";
import { clearFailures, isIpThrottled, isLocked, recordAttempt, registerFailure } from "./lockout";

export type AuthResult =
  | { status: "ok"; userId: string; role: "therapist" | "patient" }
  | { status: "totp_required" }
  | { status: "invalid" }
  | { status: "locked"; until: Date }
  | { status: "throttled" };

/**
 * Verify credentials. If the account has TOTP enabled, a valid `totpCode` must be
 * supplied in the same call. Failure reasons are deliberately coarse to the
 * caller ("invalid") to avoid leaking which factor was wrong.
 */
export async function authenticate(
  db: Db,
  input: { email: string; password: string; totpCode?: string },
  ctx: { ip?: string | null } = {},
): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  if (await isIpThrottled(db, ctx.ip)) return { status: "throttled" };

  const u = await getUserByEmail(db, email);

  // Uniform-ish work + response when the user is missing / has no password yet.
  if (!u || !u.passwordHash || u.status !== "active") {
    await verifyPassword(
      "$argon2id$v=19$m=19456,t=2,p=1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      input.password,
    ).catch(() => false);
    await recordAttempt(db, email, ctx.ip, false);
    return { status: "invalid" };
  }

  if (isLocked(u)) return { status: "locked", until: u.lockedUntil! };

  const passwordOk = await verifyPassword(u.passwordHash, input.password);
  if (!passwordOk) {
    await registerFailure(db, u.id, u.failedAttempts);
    await recordAttempt(db, email, ctx.ip, false);
    return { status: "invalid" };
  }

  if (u.totpEnabledAt && u.totpSecret) {
    if (!input.totpCode) return { status: "totp_required" };
    if (!verifyTotpCode(email, u.totpSecret, input.totpCode)) {
      await registerFailure(db, u.id, u.failedAttempts);
      await recordAttempt(db, email, ctx.ip, false);
      return { status: "invalid" };
    }
  }

  await clearFailures(db, u.id);
  await recordAttempt(db, email, ctx.ip, true);
  return { status: "ok", userId: u.id, role: u.role };
}
