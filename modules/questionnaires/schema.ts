import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

/**
 * Questionnaire library (WP-67). A therapist defines several named
 * questionnaires; at intake she picks which ones (>= 1) a patient must fill.
 *
 * - `questionnaire_template` — the definition (name + intro text).
 * - questions are `field_definition` rows (`entity = 'questionnaire'`) tagged
 *   with `template_id`, so every answer still goes through the one Field
 *   Registry validator (WP-09).
 * - `questionnaire_response` — ONE row per (patient, template): it is both the
 *   assignment and the answer container. Answers live in `field_value`
 *   (`entity_id = response.id`). A legacy row has `template_id = NULL`.
 *
 * Dual-scoped (therapist_id + patient_id): the patient fills, the therapist
 * reads — both through the scoping guard.
 */

export const questionnaireTemplate = pgTable(
  "questionnaire_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    descriptionHe: text("description_he"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("questionnaire_template_therapist_name_uq").on(t.therapistId, t.name),
    index("questionnaire_template_therapist_idx").on(t.therapistId, t.sortOrder),
  ],
);

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
    /** WP-67: which library questionnaire this is. NULL = legacy generic intake. */
    templateId: uuid("template_id").references(() => questionnaireTemplate.id, {
      onDelete: "cascade",
    }),
    status: text("status", { enum: questionnaireStatus }).notNull().default("open"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("questionnaire_response_therapist_idx").on(t.therapistId)],
);
