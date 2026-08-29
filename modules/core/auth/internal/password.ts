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
 * Password policy: at least 10 characters, containing a letter (Latin or Hebrew)
 * and a digit. No forced "uppercase" — meaningless for a Hebrew-first audience.
 */
export const passwordSchema = z
  .string()
  .min(10, "לפחות 10 תווים")
  .max(200, "עד 200 תווים")
  .regex(/\p{L}/u, "חייבת לכלול אות")
  .regex(/\d/, "חייבת לכלול ספרה");

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
