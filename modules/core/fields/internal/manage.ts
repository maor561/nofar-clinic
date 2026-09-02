import { and, eq, isNull, sql } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { fieldDefinition, type FieldEntity } from "../schema";
import { compileFieldSchema, type FieldSchema } from "./field-schema";
import { FIELD_REGISTRY } from "./registry";

/**
 * Therapist-managed field definitions (WP-60) — a *constrained* editor, not a
 * graphical form builder. It realises ADR-004 rule 4's "or a simple screen"
 * without loosening any guardrail:
 *
 *  - the serial `schema` is assembled here from typed inputs and always run
 *    through `compileFieldSchema` before it can touch the DB — the single
 *    validator stays the only boundary (ADR-019);
 *  - no `table` and no `charted` fields (a chart needs a real column mapping,
 *    which a UI can't add);
 *  - `type` + `schema` are frozen once created — editing is label / order /
 *    active only — so an existing `field_value` can never be invalidated by a
 *    definition edit;
 *  - built-in definitions (`FIELD_REGISTRY`) stay code-defined; this screen can
 *    relabel / reorder / hide them but `pnpm db:registry` reloads the originals.
 */

const BUILTIN_KEYS = new Set(FIELD_REGISTRY.map((d) => `${d.entity}.${d.key}`));

/** Field types offered by the settings UI — subset of the registry's types. */
export const UI_FIELD_TYPES = ["number", "scale", "boolean", "select", "text", "date"] as const;
export type UiFieldType = (typeof UI_FIELD_TYPES)[number];

export type ManagedFieldDef = typeof fieldDefinition.$inferSelect & { builtin: boolean };

export type NewFieldInput = {
  labelHe: string;
  type: UiFieldType;
  unit?: string | null;
  min?: number | null;
  max?: number | null;
  integer?: boolean;
  options?: string[];
  maxLength?: number | null;
  required?: boolean;
};

export class FieldDefError extends Error {}

/** Typed inputs -> serial descriptor. Throws `FieldDefError` on nonsense. */
function buildSchema(input: NewFieldInput): FieldSchema {
  const req = input.required ? ({ required: true } as const) : {};
  switch (input.type) {
    case "number": {
      const min = input.min ?? undefined;
      const max = input.max ?? undefined;
      if (min != null && max != null && max <= min) throw new FieldDefError("invalid_range");
      return {
        type: "number",
        ...(min != null ? { min } : {}),
        ...(max != null ? { max } : {}),
        ...(input.integer ? { integer: true } : {}),
        ...req,
      };
    }
    case "scale": {
      const min = input.min ?? 1;
      const max = input.max ?? 10;
      if (!Number.isInteger(min) || !Number.isInteger(max) || max <= min) {
        throw new FieldDefError("invalid_range");
      }
      return { type: "scale", min, max, ...req };
    }
    case "boolean":
      return { type: "boolean", ...req };
    case "select": {
      const options = (input.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (options.length < 2) throw new FieldDefError("need_options");
      if (new Set(options).size !== options.length) throw new FieldDefError("dup_options");
      return { type: "select", options, ...req };
    }
    case "text":
      return { type: "text", maxLength: input.maxLength ?? 2000, ...req };
    case "date":
      return { type: "date", ...req };
  }
}

function newKey(): string {
  return "f_" + crypto.randomUUID().replace(/-/g, "");
}

/** entity scope, optionally narrowed to one questionnaire template (WP-67). */
function scopeConds(therapistId: string, entity: FieldEntity, templateId?: string | null) {
  const conds = [eq(fieldDefinition.therapistId, therapistId), eq(fieldDefinition.entity, entity)];
  if (templateId === null) conds.push(isNull(fieldDefinition.templateId));
  else if (templateId !== undefined) conds.push(eq(fieldDefinition.templateId, templateId));
  return conds;
}

/** All definitions for one entity (optionally one template), ordered, flagged `builtin`. */
export async function listFieldDefs(
  db: Db,
  therapistId: string,
  entity: FieldEntity,
  opts: { includeInactive?: boolean; templateId?: string | null } = {},
): Promise<ManagedFieldDef[]> {
  const conds = scopeConds(therapistId, entity, opts.templateId);
  if (!opts.includeInactive) conds.push(eq(fieldDefinition.active, true));
  const rows = await db
    .select()
    .from(fieldDefinition)
    .where(and(...conds))
    .orderBy(fieldDefinition.order, fieldDefinition.createdAt);
  return rows.map((r) => ({ ...r, builtin: BUILTIN_KEYS.has(`${r.entity}.${r.key}`) }));
}

/** Create a definition. The schema is compiled (the hard boundary) before insert. */
export async function createFieldDef(
  db: Db,
  therapistId: string,
  entity: FieldEntity,
  input: NewFieldInput,
  templateId?: string | null,
): Promise<string> {
  const labelHe = input.labelHe.trim();
  if (labelHe.length < 2) throw new FieldDefError("invalid_label");

  const schema = buildSchema(input);
  compileFieldSchema(schema); // malformed descriptor -> throws here, nothing written

  const dup = await db
    .select({ id: fieldDefinition.id })
    .from(fieldDefinition)
    .where(
      and(...scopeConds(therapistId, entity, templateId), eq(fieldDefinition.labelHe, labelHe)),
    )
    .limit(1);
  if (dup[0]) throw new FieldDefError("duplicate_label");

  const [{ maxOrder }] = await db
    .select({ maxOrder: sql<number>`coalesce(max(${fieldDefinition.order}), 0)` })
    .from(fieldDefinition)
    .where(and(...scopeConds(therapistId, entity, templateId)));

  const [row] = await db
    .insert(fieldDefinition)
    .values({
      therapistId,
      entity,
      templateId: templateId ?? null,
      key: newKey(),
      labelHe,
      type: input.type,
      schema,
      unit: input.unit?.trim() || null,
      charted: false,
      chartedColumn: null,
      order: Number(maxOrder) + 10,
      active: true,
    })
    .returning({ id: fieldDefinition.id });
  return row.id;
}

/** Edit a definition — label / order / active only. Type & schema are frozen. */
export async function updateFieldDef(
  db: Db,
  therapistId: string,
  id: string,
  patch: { labelHe?: string; order?: number; active?: boolean },
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (patch.labelHe !== undefined) {
    const l = patch.labelHe.trim();
    if (l.length < 2) throw new FieldDefError("invalid_label");
    set.labelHe = l;
  }
  if (patch.order !== undefined) set.order = patch.order;
  if (patch.active !== undefined) set.active = patch.active;
  if (Object.keys(set).length === 0) return;
  await db
    .update(fieldDefinition)
    .set(set)
    .where(and(eq(fieldDefinition.therapistId, therapistId), eq(fieldDefinition.id, id)));
}
