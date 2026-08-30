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
export {
  setFieldValues as setFieldValuesIn,
  getFieldValues as getFieldValuesFrom,
  type FieldScope,
  type FieldWrite,
  type FieldValueOut,
} from "./internal/store";
export type { FieldEntity, FieldType } from "./schema";

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
