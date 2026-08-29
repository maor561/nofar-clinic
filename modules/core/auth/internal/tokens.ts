import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Opaque secrets (session ids, invite / reset tokens). The raw value goes to the
 * client; only its SHA-256 is persisted, so a DB dump cannot be replayed.
 */

/** URL-safe random token, ~192 bits. */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Constant-time compare of two hex digests of equal length. */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}
