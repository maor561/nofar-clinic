import { eq } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { patient } from "@/modules/patients/schema";
import { therapist } from "../schema";
import type { ActiveSession } from "./sessions";

/** Human display name for the signed-in user. */
export async function getDisplayName(db: Db, session: ActiveSession): Promise<string> {
  if (session.role === "therapist") {
    const rows = await db
      .select({ name: therapist.name })
      .from(therapist)
      .where(eq(therapist.id, session.therapistId))
      .limit(1);
    return rows[0]?.name ?? "מטפל";
  }
  if (!session.patientId) return "מטופל";
  const rows = await db
    .select({ first: patient.firstName, last: patient.lastName })
    .from(patient)
    .where(eq(patient.id, session.patientId))
    .limit(1);
  const p = rows[0];
  return p ? `${p.first} ${p.last}` : "מטופל";
}
