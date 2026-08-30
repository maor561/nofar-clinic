import { compileFieldSchema } from "./field-schema";

export class FieldValidationError extends Error {
  constructor(
    readonly fieldKey: string,
    readonly issues: { message: string; path: (string | number)[] }[],
  ) {
    super(`field "${fieldKey}" failed validation: ${issues.map((i) => i.message).join("; ")}`);
    this.name = "FieldValidationError";
  }
}

export type ValidatableDefinition = { key: string; schema: unknown };

/**
 * THE single validator. Every read and write of a field_value goes through this
 * (core/fields/store). Returns the parsed value; throws FieldValidationError.
 */
export function validateFieldValue(def: ValidatableDefinition, value: unknown): unknown {
  const compiled = compileFieldSchema(def.schema);
  const r = compiled.safeParse(value);
  if (!r.success) {
    throw new FieldValidationError(
      def.key,
      r.error.issues.map((i) => ({ message: i.message, path: [...i.path] as (string | number)[] })),
    );
  }
  return r.data;
}
