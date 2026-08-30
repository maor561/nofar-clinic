import { pgTable, uuid, integer, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

/**
 * Treatment plan (WP-14). DATA_MODEL#treatment_plan. One active plan per patient;
 * every change is a NEW immutable `treatment_plan_version` (append-only — a late
 * addition is a new version, never an overwrite). The structured content of a
 * version lives in `field_value` with entity = 'plan_version'.
 *
 * Both rows carry therapist_id + patient_id so a patient handle can read its own
 * current version through the scoping guard.
 */
export const treatmentPlan = pgTable(
  "treatment_plan",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    /** points at the latest treatment_plan_version.id (nullable only in the instant before v1) */
    currentVersionId: uuid("current_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("treatment_plan_patient").on(t.patientId)],
);

export const treatmentPlanVersion = pgTable(
  "treatment_plan_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => treatmentPlan.id, { onDelete: "cascade" }),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    note: text("note"),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("treatment_plan_version_no").on(t.planId, t.versionNo),
    index("treatment_plan_version_patient_idx").on(t.patientId, t.createdAt),
  ],
);
