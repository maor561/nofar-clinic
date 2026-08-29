import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";

/**
 * Minimal patient table. WP-10 (Patients) extends this with profile fields,
 * treatment types, consents, etc. via a follow-up migration.
 */
export const patientStatus = ["active", "inactive", "completed", "paused"] as const;
export type PatientStatus = (typeof patientStatus)[number];

export const patient = pgTable("patient", {
  id: uuid("id").primaryKey().defaultRandom(),
  therapistId: uuid("therapist_id")
    .notNull()
    .references(() => therapist.id, { onDelete: "restrict" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  status: text("status", { enum: patientStatus }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
