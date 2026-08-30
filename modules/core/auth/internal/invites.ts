import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { invite, user } from "../schema";
import { hashPassword } from "./password";
import { generateToken, hashToken } from "./tokens";

export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Issue a one-click invite for an already-provisioned patient user. Returns the raw token. */
export async function createPatientInvite(
  db: Db,
  input: { therapistId: string; patientId: string; email: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await db.insert(invite).values({
    patientId: input.patientId,
    email: input.email.trim().toLowerCase(),
    tokenHash: hashToken(token),
    expiresAt,
    therapistId: input.therapistId,
  });
  return { token, expiresAt };
}

export type InvitePreview = { email: string; patientId: string; therapistId: string };

/** Validate a token without consuming it (for rendering the accept screen). */
export async function peekInvite(db: Db, token: string): Promise<InvitePreview | null> {
  const rows = await db
    .select()
    .from(invite)
    .where(and(eq(invite.tokenHash, hashToken(token)), isNull(invite.acceptedAt)))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;
  return { email: row.email, patientId: row.patientId, therapistId: row.therapistId };
}

/**
 * Consume the invite and set the patient's password. Single-use: marks
 * accepted_at and flips the user to active. Returns the user id for session creation.
 */
export async function acceptInvite(
  db: Db,
  token: string,
  password: string,
): Promise<{ userId: string; therapistId: string; patientId: string }> {
  const tokenHash = hashToken(token);
  const rows = await db
    .select()
    .from(invite)
    .where(and(eq(invite.tokenHash, tokenHash), isNull(invite.acceptedAt)))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() <= Date.now()) throw new Error("invite_invalid");

  const users = await db
    .select()
    .from(user)
    .where(and(eq(user.patientId, row.patientId), eq(user.role, "patient")))
    .limit(1);
  const u = users[0];
  if (!u) throw new Error("invite_user_missing");

  const marked = await db
    .update(invite)
    .set({ acceptedAt: new Date() })
    .where(and(eq(invite.id, row.id), isNull(invite.acceptedAt)))
    .returning({ id: invite.id });
  if (marked.length === 0) throw new Error("invite_invalid"); // lost the race

  await db
    .update(user)
    .set({
      passwordHash: await hashPassword(password),
      status: "active",
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, u.id));

  return { userId: u.id, therapistId: row.therapistId, patientId: row.patientId };
}
