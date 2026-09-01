import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

/**
 * Internal calendar (WP-12). DATA_MODEL#appointment. Both `therapist_id` and
 * `patient_id` are present so the row is reachable by either scoped handle
 * (therapist manages the diary; a patient sees only their own).
 */
export const appointmentStatus = ["scheduled", "done", "cancelled", "no_show"] as const;
export type AppointmentStatus = (typeof appointmentStatus)[number];

export const appointment = pgTable(
  "appointment",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    treatmentType: text("treatment_type"),
    status: text("status", { enum: appointmentStatus }).notNull().default("scheduled"),
    notes: text("notes"),
    /** Google Calendar linkage — phase 2, always null in v1. */
    gcalEventId: text("gcal_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("appointment_therapist_start_idx").on(t.therapistId, t.startsAt),
    index("appointment_patient_start_idx").on(t.patientId, t.startsAt),
  ],
);
