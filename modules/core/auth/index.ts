/**
 * core/auth — public service contract.
 *
 * Credentials-only auth with server-side sessions (ADR-003 / ADR-015). The app's
 * route + middleware layer handles the actual cookie via next/headers; this
 * module owns hashing, session rows, lockout, TOTP, invites and resets.
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/modules/core/data/client";
import { therapist } from "./schema";

import { authenticate as _authenticate, type AuthResult } from "./internal/authenticate";
import { passwordSchema, verifyPassword } from "./internal/password";
import {
  registerTherapist as _registerTherapist,
  provisionPatientUser as _provisionPatientUser,
  getUserById as _getUserById,
} from "./internal/register";
import {
  createSession as _createSession,
  readSession as _readSession,
  revokeSession as _revokeSession,
  revokeAllForUser as _revokeAllForUser,
  purgeExpiredSessions as _purgeExpiredSessions,
  SESSION_COOKIE,
  SESSION_TTL_MS,
  type ActiveSession,
  type SessionContext,
} from "./internal/sessions";
import {
  createPatientInvite as _createPatientInvite,
  peekInvite as _peekInvite,
  acceptInvite as _acceptInvite,
  type InvitePreview,
} from "./internal/invites";
import {
  startPasswordReset as _startPasswordReset,
  peekReset as _peekReset,
  completePasswordReset as _completePasswordReset,
  changePassword as _changePassword,
} from "./internal/reset";
import {
  beginTotpEnrollment as _beginTotpEnrollment,
  confirmTotpEnrollment as _confirmTotpEnrollment,
} from "./internal/totp";
import { getDisplayName as _getDisplayName } from "./internal/profile";

export { SESSION_COOKIE, SESSION_TTL_MS, passwordSchema };
export type { AuthResult, ActiveSession, SessionContext, InvitePreview };

export type LoginResult =
  | {
      status: "ok";
      userId: string;
      role: "therapist" | "patient";
      therapistId: string;
      token: string;
      expiresAt: Date;
    }
  | Exclude<AuthResult, { status: "ok" }>;

// ---- registration / provisioning ----

export async function hasTherapist(): Promise<boolean> {
  const rows = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(therapist);
  return (rows[0]?.n ?? 0) > 0;
}

export function registerTherapist(input: { name: string; email: string; password: string }) {
  return _registerTherapist(getDb(), input);
}

export function provisionPatientUser(input: {
  therapistId: string;
  patientId: string;
  email: string;
}) {
  return _provisionPatientUser(getDb(), input);
}

// ---- login / sessions ----

export function authenticate(
  input: { email: string; password: string; totpCode?: string },
  ctx?: { ip?: string | null },
) {
  return _authenticate(getDb(), input, ctx);
}

/** authenticate + (on success) open a session. Returns the raw cookie token. */
export async function login(
  input: { email: string; password: string; totpCode?: string },
  ctx: { ip?: string | null; userAgent?: string | null } = {},
): Promise<LoginResult> {
  const db = getDb();
  const result = await _authenticate(db, input, { ip: ctx.ip });
  if (result.status !== "ok") return result;
  const { token, expiresAt } = await _createSession(db, result.userId, ctx);
  return {
    status: "ok",
    userId: result.userId,
    role: result.role,
    therapistId: result.therapistId,
    token,
    expiresAt,
  };
}

export function createSession(userId: string, ctx?: SessionContext) {
  return _createSession(getDb(), userId, ctx);
}

export function getDisplayName(session: ActiveSession) {
  return _getDisplayName(getDb(), session);
}

export function readSession(token: string | undefined) {
  return _readSession(getDb(), token);
}

export function revokeSession(token: string) {
  return _revokeSession(getDb(), token);
}

export function revokeAllSessions(userId: string) {
  return _revokeAllForUser(getDb(), userId);
}

export function purgeExpiredSessions() {
  return _purgeExpiredSessions(getDb());
}

// ---- invites ----

export function createPatientInvite(input: {
  therapistId: string;
  patientId: string;
  email: string;
}) {
  return _createPatientInvite(getDb(), input);
}

export function peekInvite(token: string) {
  return _peekInvite(getDb(), token);
}

export function acceptInvite(token: string, password: string) {
  return _acceptInvite(getDb(), token, password);
}

// ---- password reset / change ----

export function startPasswordReset(email: string, ip?: string | null) {
  return _startPasswordReset(getDb(), email, ip);
}

export function peekReset(token: string) {
  return _peekReset(getDb(), token);
}

export function completePasswordReset(token: string, newPassword: string) {
  return _completePasswordReset(getDb(), token, newPassword);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const db = getDb();
  const u = await _getUserById(db, userId);
  const ok = !!u?.passwordHash && (await verifyPassword(u.passwordHash, currentPassword));
  await _changePassword(db, userId, ok, newPassword);
}

// ---- TOTP ----

export function beginTotpEnrollment(userId: string, email: string) {
  return _beginTotpEnrollment(getDb(), userId, email);
}

export function confirmTotpEnrollment(userId: string, email: string, secret: string, code: string) {
  return _confirmTotpEnrollment(getDb(), userId, email, secret, code);
}
