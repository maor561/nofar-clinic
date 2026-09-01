import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";

/** Patient profile + treatment types + consents (WP-10). DATA_MODEL#patient. */

export const patientStatus = ["active", "inactive", "completed", "paused"] as const;
export type PatientStatus = (typeof patientStatus)[number];

/**
 * Treatment types are therapist-managed (WP-55). The stored value on
 * appointments / sessions / patient_treatment_type is the type's **name**
 * (a rename bulk-updates those rows). `LEGACY_TREATMENT_SLUGS` are the three
 * built-ins that migration 0015 seeds as Hebrew names.
 */
export const LEGACY_TREATMENT_SLUGS = ["naturopathy", "reflexology", "nutrition"] as const;
/** A treatment type is just its name now — kept as an alias for existing imports. */
export type TreatmentType = string;

export const treatmentType = pgTable(
  "treatment_type",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("treatment_type_therapist_name_uq").on(t.therapistId, t.name)],
);

export const consentKind = ["data_processing", "data_transfer_abroad", "research_future"] as const;
export type ConsentKind = (typeof consentKind)[number];

export const patient = pgTable(
  "patient",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    dob: date("dob"),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    photoUrl: text("photo_url"),
    status: text("status", { enum: patientStatus }).notNull().default("active"),
    treatmentGoal: text("treatment_goal"),
    generalNotes: text("general_notes"),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("patient_therapist_idx").on(t.therapistId),
    index("patient_therapist_status_idx").on(t.therapistId, t.status),
  ],
);

export const patientTreatmentType = pgTable(
  "patient_treatment_type",
  {
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    treatmentType: text("treatment_type").notNull(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
  },
  (t) => [
    unique("patient_treatment_type_pk").on(t.patientId, t.treatmentType),
    index("patient_treatment_type_therapist_idx").on(t.therapistId),
  ],
);

export const consent = pgTable(
  "consent",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    kind: text("kind", { enum: consentKind }).notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    textVersion: text("text_version").notNull().default("v1"),
  },
  (t) => [unique("consent_unique").on(t.patientId, t.kind)],
);
