import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { therapist, user } from "../schema";
import { hashPassword } from "./password";

/**
 * Register the therapist account. v1 is single-therapist: this refuses to create
 * a second therapist. Creates the `therapist` row and its `user` (role therapist).
 */
export async function registerTherapist(
  db: Db,
  input: { name: string; email: string; password: string },
): Promise<{ therapistId: string; userId: string }> {
  const email = input.email.trim().toLowerCase();

  const existing = await db.select({ n: sql<number>`count(*)::int` }).from(therapist);
  if ((existing[0]?.n ?? 0) > 0) {
    throw new Error("therapist_already_exists");
  }

  const [t] = await db
    .insert(therapist)
    .values({ name: input.name.trim(), email })
    .returning({ id: therapist.id });

  const [u] = await db
    .insert(user)
    .values({
      role: "therapist",
      email,
      passwordHash: await hashPassword(input.password),
      status: "active",
      therapistId: t.id,
    })
    .returning({ id: user.id });

  return { therapistId: t.id, userId: u.id };
}

/**
 * Create the login account for a patient (role patient, status invited, no
 * password yet). Called by the patients module when a patient is added; the
 * invite token is issued separately.
 */
export async function provisionPatientUser(
  db: Db,
  input: { therapistId: string; patientId: string; email: string },
): Promise<{ userId: string }> {
  const email = input.email.trim().toLowerCase();
  const [u] = await db
    .insert(user)
    .values({
      role: "patient",
      email,
      status: "invited",
      therapistId: input.therapistId,
      patientId: input.patientId,
    })
    .returning({ id: user.id });
  return { userId: u.id };
}

export async function getUserByEmail(db: Db, email: string) {
  const rows = await db
    .select()
    .from(user)
    .where(eq(user.email, email.trim().toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserById(db: Db, id: string) {
  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return rows[0] ?? null;
}

/** The user id of the therapist account (v1: single therapist). */
export async function getTherapistUserId(db: Db, therapistId: string): Promise<string | null> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.therapistId, therapistId), eq(user.role, "therapist")))
    .limit(1);
  return rows[0]?.id ?? null;
}
