import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

/**
 * Append-only timeline. WP-11 (Patient File + Timeline) extends this with the
 * full event-type set and `recordEvent()`. Here it exists so the scoping guard
 * has a real second patient-scoped table for the isolation suite.
 */
export const timelineEventType = [
  "appointment",
  "session",
  "plan_changed",
  "task_created",
  "task_completed",
  "document_added",
  "message",
  "questionnaire_submitted",
  "status_changed",
] as const;
export type TimelineEventType = (typeof timelineEventType)[number];

export const timelineEvent = pgTable(
  "timeline_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    type: text("type", { enum: timelineEventType }).notNull(),
    refId: uuid("ref_id"),
    summary: text("summary").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("timeline_event_patient_idx").on(t.patientId, t.occurredAt)],
);
