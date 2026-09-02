import { z } from "zod";

/**
 * The serial field schema (ADR-004 rule 1). A plain-JSON descriptor stored in
 * `field_definition.schema`; `compileFieldSchema` turns it into a real Zod
 * validator for the value. A malformed descriptor throws here — "no schema, no
 * field".
 */

const withRequired = { required: z.boolean().optional() };

export const fieldSchemaSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().optional(),
    ...withRequired,
  }),
  z.object({
    type: z.literal("number"),
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
    ...withRequired,
  }),
  z.object({
    type: z.literal("scale"),
    min: z.number().int(),
    max: z.number().int(),
    ...withRequired,
  }),
  z.object({ type: z.literal("boolean"), ...withRequired }),
  z.object({
    type: z.literal("select"),
    options: z.array(z.string().min(1)).min(1),
    multiple: z.boolean().optional(),
    ...withRequired,
  }),
  z.object({ type: z.literal("date"), ...withRequired }),
  z.object({
    type: z.literal("table"),
    columns: z
      .array(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          type: z.enum(["text", "number"]),
        }),
      )
      .min(1),
    ...withRequired,
  }),
]);

export type FieldSchema = z.infer<typeof fieldSchemaSchema>;

/** Descriptor -> Zod validator for the VALUE. Throws on a malformed descriptor. */
export function compileFieldSchema(raw: unknown): z.ZodType {
  const fs = fieldSchemaSchema.parse(raw);
  const opt = <T extends z.ZodType>(t: T) => (fs.required ? t : t.nullish());

  switch (fs.type) {
    case "text": {
      let s = z.string();
      if (fs.minLength != null) s = s.min(fs.minLength);
      if (fs.maxLength != null) s = s.max(fs.maxLength);
      return opt(fs.required ? s.min(1) : s);
    }
    case "number": {
      let s = fs.integer ? z.number().int() : z.number();
      if (fs.min != null) s = s.min(fs.min);
      if (fs.max != null) s = s.max(fs.max);
      return opt(s);
    }
    case "scale":
      return opt(z.number().int().min(fs.min).max(fs.max));
    case "boolean":
      return opt(z.boolean());
    case "select": {
      // a stored option may arrive as a number ("3") — coerce scalars to string
      const one = z.preprocess(
        (v) => (typeof v === "number" || typeof v === "boolean" ? String(v) : v),
        z.enum(fs.options as [string, ...string[]]),
      );
      return opt(fs.multiple ? z.array(one).min(fs.required ? 1 : 0) : one);
    }
    case "date":
      return opt(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך בפורמט YYYY-MM-DD"));
    case "table":
      return opt(z.array(z.record(z.string(), z.union([z.string(), z.number()]))));
  }
}
