/**
 * core/fields — the Field Registry (ADR-004).
 *
 * - Field definitions carry a serial schema; `compileFieldSchema` turns it into
 *   a Zod validator. No schema -> the definition is rejected.
 * - `setFieldValues` / `getFieldValues` are the ONLY path to `field_value` rows,
 *   and both go through the single `validateFieldValue`.
 * - v1 definitions live in code (`FIELD_REGISTRY`); `assertRegistryValid` runs in
 *   the test suite so a broken schema fails CI.
 */
import { getDb } from "@/modules/core/data/client";
import { eq, and } from "drizzle-orm";
import { fieldDefinition, type FieldEntity } from "./schema";

export { compileFieldSchema, fieldSchemaSchema, type FieldSchema } from "./internal/field-schema";
export { validateFieldValue, FieldValidationError } from "./internal/validate";
export {
  FIELD_REGISTRY,
  assertRegistryValid,
  loadRegistry as loadRegistryInto,
  type RegistryDef,
} from "./internal/registry";
import {
  setFieldValues as _setFieldValues,
  getFieldValues as _getFieldValues,
  type FieldScope,
  type FieldWrite,
} from "./internal/store";
export type { FieldScope, FieldWrite, FieldValueOut } from "./internal/store";
export type { FieldEntity, FieldType } from "./schema";

/** Upsert the field values for one (entity, entityId). Every value is validated. */
export function setFieldValuesIn(
  scope: FieldScope,
  entity: FieldEntity,
  entityId: string,
  writes: FieldWrite[],
) {
  return _setFieldValues(getDb(), scope, entity, entityId, writes);
}

/** Read + re-validate the field values for one (entity, entityId). */
export function getFieldValuesFrom(therapistId: string, entity: FieldEntity, entityId: string) {
  return _getFieldValues(getDb(), therapistId, entity, entityId);
}

/** Definitions for one entity, ordered — for rendering a form. */
export async function fieldDefinitionsFor(therapistId: string, entity: FieldEntity) {
  return getDb()
    .select()
    .from(fieldDefinition)
    .where(
      and(
        eq(fieldDefinition.therapistId, therapistId),
        eq(fieldDefinition.entity, entity),
        eq(fieldDefinition.active, true),
      ),
    )
    .orderBy(fieldDefinition.order);
}
