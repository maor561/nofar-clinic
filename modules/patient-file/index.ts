import { TherapistDb, type PatientDb } from "@/modules/core/authz";
import { timelineEvent, type TimelineEventType } from "./schema";

export type { TimelineEventType } from "./schema";
export { timelineEventType } from "./schema";

/**
 * Append one event to a patient's timeline. Every v1 module that produces an
 * event calls this (ARCHITECTURE §4.3 — no event bus). The full timeline view +
 * filters land in WP-11; this is the write path.
 *
 * Takes a scoped DB handle from core/authz, so the write is tenant-scoped and
 * auto-audited.
 */
export async function recordEvent(
  db: TherapistDb | PatientDb,
  input: {
    patientId: string;
    type: TimelineEventType;
    summary: string;
    occurredAt?: Date;
    refId?: string;
    createdBy?: string;
  },
): Promise<void> {
  // both scoped classes accept this table; narrow for the union call. A PatientDb
  // still forces its own patient_id at runtime (a patient can only append to
  // their own timeline).
  await (db as TherapistDb).insert(timelineEvent, {
    patientId: input.patientId,
    type: input.type,
    summary: input.summary,
    occurredAt: input.occurredAt ?? new Date(),
    refId: input.refId ?? null,
    createdBy: input.createdBy ?? null,
  });
}
