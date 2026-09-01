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

/**
 * Reusable "treatment series" package (WP-56) — a name + number of sessions,
 * defined once in settings and picked at intake. Therapist-scoped.
 */
export const treatmentSeriesTemplate = pgTable(
  "treatment_series_template",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sessionCount: integer("session_count").notNull(),
    /** optional link to a treatment type name (for display only). */
    treatmentType: text("treatment_type"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("treatment_series_template_therapist_name_uq").on(t.therapistId, t.name)],
);

export const patientSeriesStatus = ["active", "completed", "cancelled"] as const;
export type PatientSeriesStatus = (typeof patientSeriesStatus)[number];

/**
 * A series assigned to one patient (WP-56). `name` / `session_count` are a
 * snapshot at assignment (renaming the template later doesn't rewrite these).
 * `used_count` moves with appointments marked "done" (modules/appointments).
 * At most one row per patient is `active`.
 */
export const patientSeries = pgTable(
  "patient_series",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sessionCount: integer("session_count").notNull(),
    usedCount: integer("used_count").notNull().default(0),
    treatmentType: text("treatment_type"),
    status: text("status", { enum: patientSeriesStatus }).notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    endingNotifiedAt: timestamp("ending_notified_at", { withTimezone: true }),
  },
  (t) => [index("patient_series_patient_idx").on(t.patientId, t.status)],
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
