import { and, asc, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { TherapistDb, type PatientDb } from "@/modules/core/authz";
import { timelineEvent, type TimelineEventType } from "./schema";

export type { TimelineEventType } from "./schema";
export { timelineEventType } from "./schema";

/** Hebrew labels for the timeline event types (UI + filter chips). */
export const TIMELINE_LABEL: Record<TimelineEventType, string> = {
  appointment: "פגישה",
  session: "מפגש טיפולי",
  plan_changed: "עדכון תוכנית",
  task_created: "משימה נוצרה",
  task_completed: "משימה הושלמה",
  document_added: "מסמך",
  message: "הודעה",
  questionnaire_submitted: "שאלון",
  status_changed: "סטטוס",
  food_log: "יומן אכילה",
};

export type TimelineEntry = InferSelectModel<typeof timelineEvent>;

export type TimelineFilter = {
  /** restrict to these event types; empty / undefined = all */
  types?: TimelineEventType[];
  /** occurredAt >= since */
  since?: Date;
  /** occurredAt <= until */
  until?: Date;
  /** oldest→newest instead of the default newest→oldest */
  ascending?: boolean;
  limit?: number;
  offset?: number;
};

const MAX_PAGE = 500;

function timelineConds(patientId: string, f: TimelineFilter): SQL {
  const conds: SQL[] = [eq(timelineEvent.patientId, patientId)];
  if (f.types?.length) conds.push(inArray(timelineEvent.type, f.types));
  if (f.since) conds.push(gte(timelineEvent.occurredAt, f.since));
  if (f.until) conds.push(lte(timelineEvent.occurredAt, f.until));
  return and(...conds)!;
}

/**
 * Read a patient's timeline (WP-11). Scoped through core/authz — a `TherapistDb`
 * AND-s `therapist_id`, a `PatientDb` also AND-s `patient_id`, so neither handle
 * can reach another tenant's events regardless of the `patientId` passed in.
 * Backed by `timeline_event_patient_idx` on `(patient_id, occurred_at)`.
 */
export async function listTimeline(
  db: TherapistDb | PatientDb,
  patientId: string,
  filter: TimelineFilter = {},
): Promise<TimelineEntry[]> {
  const order = filter.ascending
    ? [asc(timelineEvent.occurredAt), asc(timelineEvent.createdAt)]
    : [desc(timelineEvent.occurredAt), desc(timelineEvent.createdAt)];
  return (db as TherapistDb).list(timelineEvent, {
    where: timelineConds(patientId, filter),
    orderBy: order,
    limit: Math.min(filter.limit ?? MAX_PAGE, MAX_PAGE),
    offset: filter.offset ?? 0,
  });
}

/** Count matching timeline events (for headers / filter badges). */
export async function countTimeline(
  db: TherapistDb | PatientDb,
  patientId: string,
  filter: Omit<TimelineFilter, "limit" | "offset" | "ascending"> = {},
): Promise<number> {
  return (db as TherapistDb).count(timelineEvent, timelineConds(patientId, filter));
}

/**
 * Append one event to a patient's timeline. Every v1 module that produces an
 * event calls this (ARCHITECTURE §4.3 — no event bus).
 *
 * Takes a scoped DB handle from core/authz, so the write is tenant-scoped and
 * auto-audited. A `PatientDb` still forces its own `patient_id` at runtime (a
 * patient can only append to their own timeline).
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
  await (db as TherapistDb).insert(timelineEvent, {
    patientId: input.patientId,
    type: input.type,
    summary: input.summary,
    occurredAt: input.occurredAt ?? new Date(),
    refId: input.refId ?? null,
    createdBy: input.createdBy ?? null,
  });
}
