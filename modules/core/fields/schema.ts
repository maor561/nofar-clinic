import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";

/**
 * Field Registry (ADR-004). Flexible fields for treatment sessions, plan
 * versions, questionnaires and (stage 2) metrics. Every definition carries a
 * serial schema; every value goes through the single validator in core/fields.
 */

export const fieldEntity = [
  "treatment_session",
  "plan_version",
  "questionnaire",
  "metric",
] as const;
export type FieldEntity = (typeof fieldEntity)[number];

export const fieldType = ["text", "number", "scale", "boolean", "select", "date", "table"] as const;
export type FieldType = (typeof fieldType)[number];

export const fieldDefinition = pgTable(
  "field_definition",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    entity: text("entity", { enum: fieldEntity }).notNull(),
    /** WP-67: for entity 'questionnaire', which library template this question belongs to. */
    templateId: uuid("template_id"),
    key: text("key").notNull(),
    labelHe: text("label_he").notNull(),
    type: text("type", { enum: fieldType }).notNull(),
    /** the serial FieldSchema (see internal/field-schema.ts) — NOT NULL: no schema, no field */
    schema: jsonb("schema").notNull(),
    unit: text("unit"),
    /** if true, a real column mapping is required (charted_column) — enforced at registry load */
    charted: boolean("charted").notNull().default(false),
    chartedColumn: text("charted_column"),
    order: integer("order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("field_definition_scope_key").on(t.therapistId, t.entity, t.key),
    index("field_definition_entity_idx").on(t.therapistId, t.entity),
  ],
);

export const fieldValue = pgTable(
  "field_value",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id").notNull(),
    patientId: uuid("patient_id").notNull(),
    entity: text("entity", { enum: fieldEntity }).notNull(),
    entityId: uuid("entity_id").notNull(),
    definitionId: uuid("definition_id")
      .notNull()
      .references(() => fieldDefinition.id, { onDelete: "restrict" }),
    value: jsonb("value").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("field_value_unique").on(t.entity, t.entityId, t.definitionId),
    index("field_value_entity_idx").on(t.therapistId, t.entity, t.entityId),
    index("field_value_patient_idx").on(t.patientId),
  ],
);
