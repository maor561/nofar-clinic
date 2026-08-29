import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { passwordReset, user } from "../schema";
import { hashPassword } from "./password";
import { generateToken, hashToken } from "./tokens";
import { revokeAllForUser } from "./sessions";

export const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Start a reset. Always resolves the same way whether or not the email exists
 * (no account enumeration). Returns a token only when there is a user, for the
 * caller to email; otherwise null.
 */
export async function startPasswordReset(
  db: Db,
  email: string,
  ip: string | null | undefined,
): Promise<{ token: string; userId: string } | null> {
  const rows = await db
    .select({ id: user.id, status: user.status })
    .from(user)
    .where(eq(user.email, email.trim().toLowerCase()))
    .limit(1);
  const u = rows[0];
  if (!u || u.status === "disabled") return null;

  // invalidate outstanding resets for this user
  await db
    .update(passwordReset)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordReset.userId, u.id), isNull(passwordReset.usedAt)));

  const token = generateToken();
  await db.insert(passwordReset).values({
    userId: u.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + RESET_TTL_MS),
    ip: ip ?? null,
  });
  return { token, userId: u.id };
}

export async function peekReset(db: Db, token: string): Promise<boolean> {
  const rows = await db
    .select({ expiresAt: passwordReset.expiresAt })
    .from(passwordReset)
    .where(and(eq(passwordReset.tokenHash, hashToken(token)), isNull(passwordReset.usedAt)))
    .limit(1);
  const row = rows[0];
  return !!row && row.expiresAt.getTime() > Date.now();
}

/**
 * Complete a reset: single-use token, sets the new password, clears any lock,
 * and revokes every existing session for that user.
 */
export async function completePasswordReset(
  db: Db,
  token: string,
  newPassword: string,
): Promise<{ userId: string }> {
  const tokenHash = hashToken(token);
  const rows = await db
    .select()
    .from(passwordReset)
    .where(and(eq(passwordReset.tokenHash, tokenHash), isNull(passwordReset.usedAt)))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() <= Date.now()) throw new Error("reset_invalid");

  const consumed = await db
    .update(passwordReset)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordReset.id, row.id), isNull(passwordReset.usedAt)))
    .returning({ id: passwordReset.id });
  if (consumed.length === 0) throw new Error("reset_invalid");

  await db
    .update(user)
    .set({
      passwordHash: await hashPassword(newPassword),
      failedAttempts: 0,
      lockedUntil: null,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(user.id, row.userId));

  await revokeAllForUser(db, row.userId);
  return { userId: row.userId };
}

/** Signed-in password change — verifies the current password first. */
export async function changePassword(
  db: Db,
  userId: string,
  currentPasswordValid: boolean,
  newPassword: string,
): Promise<void> {
  if (!currentPasswordValid) throw new Error("current_password_invalid");
  await db
    .update(user)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(user.id, userId));
}
