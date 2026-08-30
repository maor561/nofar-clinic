import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { fieldDefinition, fieldValue, type FieldEntity } from "../schema";
import { validateFieldValue } from "./validate";

/**
 * The only sanctioned path to `field_value` rows. Validates on write AND on read
 * (a tampered / stale JSONB row is caught, not trusted).
 */

export type FieldScope = { therapistId: string; patientId: string };

async function loadDefs(db: Db, therapistId: string, ids: string[]) {
  if (ids.length === 0) return new Map<string, typeof fieldDefinition.$inferSelect>();
  const rows = await db
    .select()
    .from(fieldDefinition)
    .where(and(eq(fieldDefinition.therapistId, therapistId), inArray(fieldDefinition.id, ids)));
  return new Map(rows.map((r) => [r.id, r]));
}

export type FieldWrite = { definitionId: string; value: unknown };

/** Upsert a set of field values for one (entity, entityId). Every value is validated. */
export async function setFieldValues(
  db: Db,
  scope: FieldScope,
  entity: FieldEntity,
  entityId: string,
  writes: FieldWrite[],
): Promise<void> {
  const defs = await loadDefs(
    db,
    scope.therapistId,
    writes.map((w) => w.definitionId),
  );

  for (const w of writes) {
    const def = defs.get(w.definitionId);
    if (!def) throw new Error(`unknown field definition ${w.definitionId}`);
    if (def.entity !== entity) {
      throw new Error(`definition ${def.key} is for "${def.entity}", not "${entity}"`);
    }
    const parsed = validateFieldValue(def, w.value);

    const existing = await db
      .select({ id: fieldValue.id })
      .from(fieldValue)
      .where(
        and(
          eq(fieldValue.entity, entity),
          eq(fieldValue.entityId, entityId),
          eq(fieldValue.definitionId, w.definitionId),
        ),
      )
      .limit(1);

    const row = {
      therapistId: scope.therapistId,
      patientId: scope.patientId,
      entity,
      entityId,
      definitionId: w.definitionId,
      value: parsed ?? null,
      recordedAt: new Date(),
    };
    if (existing[0]) {
      await db.update(fieldValue).set(row).where(eq(fieldValue.id, existing[0].id));
    } else {
      await db.insert(fieldValue).values(row);
    }
  }
}

export type FieldValueOut = {
  definitionId: string;
  key: string;
  labelHe: string;
  type: string;
  unit: string | null;
  value: unknown;
  recordedAt: Date;
};

/** Read + re-validate the field values for one (entity, entityId). */
export async function getFieldValues(
  db: Db,
  therapistId: string,
  entity: FieldEntity,
  entityId: string,
): Promise<FieldValueOut[]> {
  const rows = await db
    .select({
      definitionId: fieldValue.definitionId,
      value: fieldValue.value,
      recordedAt: fieldValue.recordedAt,
      key: fieldDefinition.key,
      labelHe: fieldDefinition.labelHe,
      type: fieldDefinition.type,
      unit: fieldDefinition.unit,
      schema: fieldDefinition.schema,
      order: fieldDefinition.order,
    })
    .from(fieldValue)
    .innerJoin(fieldDefinition, eq(fieldDefinition.id, fieldValue.definitionId))
    .where(
      and(
        eq(fieldValue.therapistId, therapistId),
        eq(fieldValue.entity, entity),
        eq(fieldValue.entityId, entityId),
      ),
    )
    .orderBy(fieldDefinition.order);

  return rows.map((r) => ({
    definitionId: r.definitionId,
    key: r.key,
    labelHe: r.labelHe,
    type: r.type,
    unit: r.unit,
    value: validateFieldValue({ key: r.key, schema: r.schema }, r.value),
    recordedAt: r.recordedAt,
  }));
}
