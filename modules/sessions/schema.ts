import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { appointment } from "@/modules/appointments/schema";

/**
 * Treatment session record (WP-13). DATA_MODEL#treatment_session. One long
 * clinical note captured as a single flow; per-domain metrics (energy, sleep,
 * weight …) hang off `field_value` with entity = 'treatment_session'.
 *
 * Dual-scoped (therapist_id + patient_id) so it typechecks against both scoped
 * handles; v1 has no patient-facing session screen.
 */
export const treatmentSession = pgTable(
  "treatment_session",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    appointmentId: uuid("appointment_id").references(() => appointment.id, {
      onDelete: "set null",
    }),
    date: date("date").notNull(),
    treatmentType: text("treatment_type"),
    patientReport: text("patient_report"),
    complaints: text("complaints"),
    changesSinceLast: text("changes_since_last"),
    treatmentDone: text("treatment_done"),
    therapistNotes: text("therapist_notes"),
    recommendations: text("recommendations"),
    nextFocus: text("next_focus"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("treatment_session_patient_idx").on(t.patientId, t.date),
    index("treatment_session_therapist_idx").on(t.therapistId, t.date),
  ],
);
