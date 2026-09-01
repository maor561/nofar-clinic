import { Secret, TOTP } from "otpauth";
import { eq } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { user } from "../schema";

const ISSUER = "Momentum";

function totpFor(email: string, secretBase32: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secretBase32),
  });
}

/**
 * Begin TOTP enrollment: generate a secret, store it (not yet enabled), and
 * return the otpauth:// URI for the authenticator QR + the base32 for manual entry.
 * NOTE: secret is stored in plaintext for now — encryption at rest is a WP-21 item.
 */
export async function beginTotpEnrollment(
  db: Db,
  userId: string,
  email: string,
): Promise<{ uri: string; secret: string }> {
  const secret = new Secret({ size: 20 }).base32;
  await db
    .update(user)
    .set({ totpSecret: secret, updatedAt: new Date() })
    .where(eq(user.id, userId));
  return { uri: totpFor(email, secret).toString(), secret };
}

/** Confirm the first code and mark TOTP enabled. */
export async function confirmTotpEnrollment(
  db: Db,
  userId: string,
  email: string,
  secret: string,
  code: string,
): Promise<boolean> {
  const ok = totpFor(email, secret).validate({ token: code, window: 1 }) !== null;
  if (ok) {
    await db
      .update(user)
      .set({ totpEnabledAt: new Date(), updatedAt: new Date() })
      .where(eq(user.id, userId));
  }
  return ok;
}

export function verifyTotpCode(email: string, secret: string, code: string): boolean {
  return totpFor(email, secret).validate({ token: code, window: 1 }) !== null;
}
