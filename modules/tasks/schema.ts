import { pgTable, uuid, text, date, timestamp, index } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { taskFrequency, taskStatus } from "./labels";

/**
 * Patient task (WP-15). DATA_MODEL#task. The therapist assigns it; the patient
 * marks it done. Dual-scoped (therapist_id + patient_id) so a patient handle can
 * read and update the status of their own tasks through the scoping guard.
 */
export { taskFrequency, taskStatus, type TaskFrequency, type TaskStatus } from "./labels";

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    frequency: text("frequency", { enum: taskFrequency }).notNull().default("once"),
    status: text("status", { enum: taskStatus }).notNull().default("open"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("task_patient_status_idx").on(t.patientId, t.status),
    index("task_therapist_idx").on(t.therapistId, t.createdAt),
  ],
);
