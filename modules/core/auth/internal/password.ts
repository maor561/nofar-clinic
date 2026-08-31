import { hash, verify } from "@node-rs/argon2";
import { z } from "zod";

// OWASP argon2id guidance: m = 19 MiB, t = 2, p = 1.
// algorithm 2 = Argon2id (enum is `const`, unusable under isolatedModules).
const ARGON_OPTS = {
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Password policy: at least 10 characters. No composition rules — a 10+ digit
 * PIN, an all-Hebrew phrase, or a mix are all accepted. Length carries the
 * entropy; forced character classes mostly push people to predictable patterns.
 */
export const passwordSchema = z.string().min(10, "לפחות 10 תווים").max(200, "עד 200 תווים");

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON_OPTS);
}

export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(storedHash, plain, ARGON_OPTS);
  } catch {
    return false;
  }
}
