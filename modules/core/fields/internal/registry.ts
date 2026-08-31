import { and, eq } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { fieldDefinition, type FieldEntity, type FieldType } from "../schema";
import { compileFieldSchema, type FieldSchema } from "./field-schema";

/**
 * v1 field definitions live in code (ADR-004 rule 4 — no graphical builder yet).
 * `loadRegistry` upserts them per therapist. `assertRegistryValid` is run as a
 * test so CI fails on a broken schema — "a definition without a valid schema
 * fails the build".
 */
export type RegistryDef = {
  entity: FieldEntity;
  key: string;
  labelHe: string;
  type: FieldType;
  schema: FieldSchema;
  unit?: string;
  charted?: boolean;
  chartedColumn?: string;
  order?: number;
};

export const FIELD_REGISTRY: RegistryDef[] = [
  // --- treatment session, per-domain self-report ---
  {
    entity: "treatment_session",
    key: "energy_level",
    labelHe: "רמת אנרגיה",
    type: "scale",
    schema: { type: "scale", min: 1, max: 10 },
    order: 10,
  },
  {
    entity: "treatment_session",
    key: "sleep_quality",
    labelHe: "איכות שינה",
    type: "scale",
    schema: { type: "scale", min: 1, max: 10 },
    order: 20,
  },
  {
    entity: "treatment_session",
    key: "weight_kg",
    labelHe: "משקל",
    type: "number",
    schema: { type: "number", min: 20, max: 400 },
    unit: "ק״ג",
    order: 30,
  },
  // --- intake questionnaire ---
  {
    entity: "questionnaire",
    key: "chronic_conditions",
    labelHe: "מחלות רקע",
    type: "select",
    schema: {
      type: "select",
      multiple: true,
      options: ["תת־פעילות בלוטת התריס", "סוכרת / טרום־סוכרת", "יתר לחץ דם", "אנמיה", "אין"],
    },
    order: 10,
  },
  {
    entity: "questionnaire",
    key: "regular_medications",
    labelHe: "תרופות קבועות",
    type: "text",
    schema: { type: "text", maxLength: 2000 },
    order: 20,
  },
  {
    entity: "questionnaire",
    key: "daily_energy",
    labelHe: "רמת אנרגיה ביום־יום",
    type: "scale",
    schema: { type: "scale", min: 1, max: 10 },
    order: 30,
  },
  {
    entity: "questionnaire",
    key: "main_goal",
    labelHe: "המטרה העיקרית שלך בליווי",
    type: "text",
    schema: { type: "text", maxLength: 1000 },
    order: 40,
  },
  {
    entity: "questionnaire",
    key: "allergies",
    labelHe: "אלרגיות ורגישויות מזון",
    type: "text",
    schema: { type: "text", maxLength: 1000 },
    order: 50,
  },
  {
    entity: "questionnaire",
    key: "meals_per_day",
    labelHe: "כמה ארוחות ביום בממוצע",
    type: "number",
    schema: { type: "number", min: 1, max: 12, integer: true },
    order: 60,
  },
  {
    entity: "questionnaire",
    key: "exercise_freq",
    labelHe: "תדירות פעילות גופנית",
    type: "select",
    schema: {
      type: "select",
      options: ["אין", "1–2 בשבוע", "3–4 בשבוע", "5+ בשבוע"],
    },
    order: 70,
  },
  {
    entity: "questionnaire",
    key: "sleep_hours",
    labelHe: "שעות שינה בלילה (בממוצע)",
    type: "number",
    schema: { type: "number", min: 0, max: 16 },
    order: 80,
  },
  // --- treatment plan version, structured content ---
  {
    entity: "plan_version",
    key: "nutrition",
    labelHe: "המלצות תזונה",
    type: "text",
    schema: { type: "text", maxLength: 4000 },
    order: 10,
  },
  {
    entity: "plan_version",
    key: "supplements",
    labelHe: "תוספי תזונה וצמחי מרפא",
    type: "text",
    schema: { type: "text", maxLength: 4000 },
    order: 20,
  },
  {
    entity: "plan_version",
    key: "lifestyle",
    labelHe: "אורח חיים ופעילות",
    type: "text",
    schema: { type: "text", maxLength: 4000 },
    order: 30,
  },
  {
    entity: "plan_version",
    key: "goals",
    labelHe: "יעדים לתקופה",
    type: "text",
    schema: { type: "text", maxLength: 2000 },
    order: 40,
  },
];

/** Compile every schema + check the charted rule. Throws on the first problem. */
export function assertRegistryValid(defs: RegistryDef[] = FIELD_REGISTRY): void {
  const seen = new Set<string>();
  for (const d of defs) {
    const id = `${d.entity}.${d.key}`;
    if (seen.has(id)) throw new Error(`duplicate field definition: ${id}`);
    seen.add(id);

    try {
      compileFieldSchema(d.schema);
    } catch (e) {
      throw new Error(`field "${id}" has an invalid schema: ${(e as Error).message}`);
    }
    if (d.schema.type !== d.type) {
      throw new Error(`field "${id}": type "${d.type}" != schema.type "${d.schema.type}"`);
    }
    // ADR-004 rule 3: charted fields need a real-column mapping.
    if (d.charted && !d.chartedColumn) {
      throw new Error(`field "${id}" is charted=true but has no chartedColumn mapping`);
    }
  }
}

export async function loadRegistry(
  db: Db,
  therapistId: string,
  defs: RegistryDef[] = FIELD_REGISTRY,
): Promise<void> {
  assertRegistryValid(defs);
  for (const d of defs) {
    const existing = await db
      .select({ id: fieldDefinition.id })
      .from(fieldDefinition)
      .where(
        and(
          eq(fieldDefinition.therapistId, therapistId),
          eq(fieldDefinition.entity, d.entity),
          eq(fieldDefinition.key, d.key),
        ),
      )
      .limit(1);

    const row = {
      therapistId,
      entity: d.entity,
      key: d.key,
      labelHe: d.labelHe,
      type: d.type,
      schema: d.schema,
      unit: d.unit ?? null,
      charted: d.charted ?? false,
      chartedColumn: d.chartedColumn ?? null,
      order: d.order ?? 0,
      active: true,
    };

    if (existing[0]) {
      await db.update(fieldDefinition).set(row).where(eq(fieldDefinition.id, existing[0].id));
    } else {
      await db.insert(fieldDefinition).values(row);
    }
  }
}
