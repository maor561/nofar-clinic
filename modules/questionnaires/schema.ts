import { pgTable, uuid, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

/**
 * Intake questionnaire (WP-18). One per patient. The response row is just a
 * container + submission state; the answers live in `field_value` with
 * `entity = 'questionnaire'`, `entity_id = <response.id>` (WP-09).
 *
 * Dual-scoped (therapist_id + patient_id): the patient fills it, the therapist
 * reads it — both through the scoping guard.
 */
export const questionnaireStatus = ["open", "submitted"] as const;
export type QuestionnaireStatus = (typeof questionnaireStatus)[number];

export const questionnaireResponse = pgTable(
  "questionnaire_response",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    status: text("status", { enum: questionnaireStatus }).notNull().default("open"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("questionnaire_response_patient").on(t.patientId),
    index("questionnaire_response_therapist_idx").on(t.therapistId),
  ],
);
