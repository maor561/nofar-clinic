import { and, eq, gte, sql } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { loginAttempt, user } from "../schema";

/** Lock the account after this many consecutive failures. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCK_DURATION_MS = 15 * 60 * 1000;
/** Independent IP throttle: this many failures from one IP inside the window. */
export const IP_WINDOW_MS = 15 * 60 * 1000;
export const IP_MAX_FAILURES = 15;

export async function recordAttempt(
  db: Db,
  email: string,
  ip: string | null | undefined,
  success: boolean,
): Promise<void> {
  await db.insert(loginAttempt).values({ email: email.toLowerCase(), ip: ip ?? null, success });
}

export async function isIpThrottled(db: Db, ip: string | null | undefined): Promise<boolean> {
  if (!ip) return false;
  const since = new Date(Date.now() - IP_WINDOW_MS);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginAttempt)
    .where(
      and(eq(loginAttempt.ip, ip), eq(loginAttempt.success, false), gte(loginAttempt.at, since)),
    );
  return (rows[0]?.n ?? 0) >= IP_MAX_FAILURES;
}

export function isLocked(u: { lockedUntil: Date | null }): boolean {
  return !!u.lockedUntil && u.lockedUntil.getTime() > Date.now();
}

export async function registerFailure(
  db: Db,
  userId: string,
  currentFailed: number,
): Promise<void> {
  const next = currentFailed + 1;
  const lockedUntil = next >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_DURATION_MS) : null;
  await db
    .update(user)
    .set({ failedAttempts: next, lockedUntil, updatedAt: new Date() })
    .where(eq(user.id, userId));
}

export async function clearFailures(db: Db, userId: string): Promise<void> {
  await db
    .update(user)
    .set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(user.id, userId));
}
