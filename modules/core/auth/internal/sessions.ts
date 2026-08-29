import { eq, lt } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { session, user } from "../schema";
import { generateToken, hashToken } from "./tokens";

export const SESSION_COOKIE = "nofar_session";
/** Absolute session lifetime. Health data — kept short. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
/** Re-issue the cookie + extend once a session is older than this since last seen. */
export const SESSION_ROTATE_AFTER_MS = 24 * 60 * 60 * 1000;

export type SessionContext = { ip?: string | null; userAgent?: string | null };

export type ActiveSession = {
  userId: string;
  role: "therapist" | "patient";
  therapistId: string;
  patientId: string | null;
  expiresAt: Date;
};

/** Create a session row; returns the raw cookie value (only its hash is stored). */
export async function createSession(
  db: Db,
  userId: string,
  ctx: SessionContext = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(session).values({
    id: hashToken(token),
    userId,
    expiresAt,
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ?? null,
  });
  return { token, expiresAt };
}

/**
 * Resolve a cookie value to an active session, or null. Expired rows are deleted
 * lazily. When the session is stale, a fresh token is returned for the caller to
 * set on the response (sliding expiry without unbounded lifetime).
 */
export async function readSession(
  db: Db,
  token: string | undefined,
): Promise<{ active: ActiveSession; renewedToken?: string } | null> {
  if (!token) return null;
  const id = hashToken(token);
  const row = await db
    .select({
      sUserId: session.userId,
      sExpiresAt: session.expiresAt,
      sLastSeenAt: session.lastSeenAt,
      role: user.role,
      therapistId: user.therapistId,
      patientId: user.patientId,
      status: user.status,
    })
    .from(session)
    .innerJoin(user, eq(user.id, session.userId))
    .where(eq(session.id, id))
    .limit(1);

  const found = row[0];
  if (!found) return null;

  if (found.sExpiresAt.getTime() <= Date.now() || found.status === "disabled") {
    await db.delete(session).where(eq(session.id, id));
    return null;
  }

  const active: ActiveSession = {
    userId: found.sUserId,
    role: found.role,
    therapistId: found.therapistId,
    patientId: found.patientId,
    expiresAt: found.sExpiresAt,
  };

  const stale = Date.now() - found.sLastSeenAt.getTime() > SESSION_ROTATE_AFTER_MS;
  if (!stale) {
    await db.update(session).set({ lastSeenAt: new Date() }).where(eq(session.id, id));
    return { active };
  }

  // rotate: issue a new token, keep the same logical session window bounded.
  const newToken = generateToken();
  const newExpiry = new Date(Date.now() + SESSION_TTL_MS);
  await db
    .update(session)
    .set({ id: hashToken(newToken), lastSeenAt: new Date(), expiresAt: newExpiry })
    .where(eq(session.id, id));
  return { active: { ...active, expiresAt: newExpiry }, renewedToken: newToken };
}

export async function revokeSession(db: Db, token: string): Promise<void> {
  await db.delete(session).where(eq(session.id, hashToken(token)));
}

export async function revokeAllForUser(db: Db, userId: string): Promise<void> {
  await db.delete(session).where(eq(session.userId, userId));
}

/** Housekeeping — safe to call from a cron later. */
export async function purgeExpiredSessions(db: Db): Promise<void> {
  await db.delete(session).where(lt(session.expiresAt, new Date()));
}
