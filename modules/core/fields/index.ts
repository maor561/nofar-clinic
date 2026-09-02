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
import { eq, and, isNull } from "drizzle-orm";
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
import {
  listFieldDefs as _listFieldDefs,
  createFieldDef as _createFieldDef,
  updateFieldDef as _updateFieldDef,
  type NewFieldInput,
} from "./internal/manage";
export type { FieldScope, FieldWrite, FieldValueOut } from "./internal/store";
export {
  UI_FIELD_TYPES,
  FieldDefError,
  type UiFieldType,
  type ManagedFieldDef,
  type NewFieldInput,
} from "./internal/manage";
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

/** Read + re-validate the field values for one (entity, entityId), patient-scoped. */
export function getFieldValuesFrom(scope: FieldScope, entity: FieldEntity, entityId: string) {
  return _getFieldValues(getDb(), scope, entity, entityId);
}

/**
 * Definitions for one entity, ordered — for rendering a form. Pass `templateId`
 * to get a single questionnaire template's questions; pass `null` for the
 * legacy (template-less) set; omit it for every definition of the entity.
 */
export async function fieldDefinitionsFor(
  therapistId: string,
  entity: FieldEntity,
  templateId?: string | null,
) {
  const conds = [
    eq(fieldDefinition.therapistId, therapistId),
    eq(fieldDefinition.entity, entity),
    eq(fieldDefinition.active, true),
  ];
  if (templateId === null) conds.push(isNull(fieldDefinition.templateId));
  else if (templateId !== undefined) conds.push(eq(fieldDefinition.templateId, templateId));
  return getDb()
    .select()
    .from(fieldDefinition)
    .where(and(...conds))
    .orderBy(fieldDefinition.order);
}

/* --- therapist-managed definitions (WP-60) — see internal/manage.ts --- */

/** All definitions for one entity (default active only), for the settings screen. */
export function listManagedFieldDefs(
  therapistId: string,
  entity: FieldEntity,
  opts?: { includeInactive?: boolean; templateId?: string | null },
) {
  return _listFieldDefs(getDb(), therapistId, entity, opts);
}

/** Create a definition from typed inputs — schema compiled before insert. */
export function createManagedFieldDef(
  therapistId: string,
  entity: FieldEntity,
  input: NewFieldInput,
  templateId?: string | null,
) {
  return _createFieldDef(getDb(), therapistId, entity, input, templateId);
}

/** Edit label / order / active. Type & schema stay frozen. */
export function updateManagedFieldDef(
  therapistId: string,
  id: string,
  patch: { labelHe?: string; order?: number; active?: boolean },
) {
  return _updateFieldDef(getDb(), therapistId, id, patch);
}
