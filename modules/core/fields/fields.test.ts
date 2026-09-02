// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { eq, and } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { fieldDefinition, fieldValue } from "./schema";
import { compileFieldSchema } from "./internal/field-schema";
import { validateFieldValue, FieldValidationError } from "./internal/validate";
import {
  FIELD_REGISTRY,
  assertRegistryValid,
  loadRegistry,
  type RegistryDef,
} from "./internal/registry";
import { setFieldValues, getFieldValues } from "./internal/store";

const V = (schema: unknown, value: unknown) => validateFieldValue({ key: "k", schema }, value);

describe("compileFieldSchema", () => {
  it("compiles every field type", () => {
    for (const s of [
      { type: "text" },
      { type: "number", min: 0 },
      { type: "scale", min: 1, max: 10 },
      { type: "boolean" },
      { type: "select", options: ["a", "b"] },
      { type: "date" },
      { type: "table", columns: [{ key: "c", label: "C", type: "text" }] },
    ]) {
      expect(() => compileFieldSchema(s)).not.toThrow();
    }
  });

  it("throws on a malformed descriptor (no schema, no field)", () => {
    expect(() => compileFieldSchema({ type: "nope" })).toThrow();
    expect(() => compileFieldSchema({ type: "scale" })).toThrow(); // missing min/max
    expect(() => compileFieldSchema({})).toThrow();
    expect(() => compileFieldSchema(null)).toThrow();
  });
});

describe("validateFieldValue", () => {
  it("scale — integer within range only", () => {
    const s = { type: "scale", min: 1, max: 10, required: true };
    expect(V(s, 5)).toBe(5);
    expect(() => V(s, 0)).toThrow(FieldValidationError);
    expect(() => V(s, 11)).toThrow(FieldValidationError);
    expect(() => V(s, 3.5)).toThrow(FieldValidationError);
    expect(() => V(s, "5")).toThrow(FieldValidationError);
  });

  it("number — respects min/max/integer", () => {
    expect(V({ type: "number", min: 20, max: 400 }, 72.4)).toBe(72.4);
    expect(() => V({ type: "number", min: 20 }, 10)).toThrow();
    expect(() => V({ type: "number", integer: true }, 1.5)).toThrow();
  });

  it("select — single and multiple", () => {
    expect(V({ type: "select", options: ["a", "b"], required: true }, "a")).toBe("a");
    expect(() => V({ type: "select", options: ["a", "b"], required: true }, "z")).toThrow();
    expect(V({ type: "select", options: ["a", "b"], multiple: true }, ["a"])).toEqual(["a"]);
    expect(() => V({ type: "select", options: ["a", "b"], multiple: true }, ["a", "z"])).toThrow();
  });

  it("select — coerces a numeric option to its string form", () => {
    const s = { type: "select", options: ["1–2", "3", "4"], required: true };
    expect(V(s, 3)).toBe("3");
    expect(V({ ...s, multiple: true }, [3, "1–2"])).toEqual(["3", "1–2"]);
  });

  it("boolean / date / text rules", () => {
    expect(V({ type: "boolean", required: true }, false)).toBe(false);
    expect(() => V({ type: "boolean", required: true }, "true")).toThrow();
    expect(V({ type: "date", required: true }, "2026-08-30")).toBe("2026-08-30");
    expect(() => V({ type: "date", required: true }, "30/08/2026")).toThrow();
    expect(() => V({ type: "text", maxLength: 5, required: true }, "toolong")).toThrow();
  });

  it("required vs optional", () => {
    expect(() => V({ type: "text", required: true }, "")).toThrow();
    expect(() => V({ type: "text", required: true }, null)).toThrow();
    expect(V({ type: "text" }, null)).toBeNull();
    expect(V({ type: "text" }, undefined)).toBeUndefined();
  });

  it("attaches the field key to the error", () => {
    try {
      validateFieldValue({ key: "energy_level", schema: { type: "scale", min: 1, max: 10 } }, 99);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(FieldValidationError);
      expect((e as FieldValidationError).fieldKey).toBe("energy_level");
    }
  });
});

describe("registry", () => {
  it("the v1 registry is valid", () => {
    expect(() => assertRegistryValid(FIELD_REGISTRY)).not.toThrow();
  });

  it("rejects a duplicate key", () => {
    const dup: RegistryDef[] = [
      { entity: "questionnaire", key: "x", labelHe: "x", type: "text", schema: { type: "text" } },
      { entity: "questionnaire", key: "x", labelHe: "x2", type: "text", schema: { type: "text" } },
    ];
    expect(() => assertRegistryValid(dup)).toThrow(/duplicate/i);
  });

  it("rejects a type/schema mismatch", () => {
    const bad: RegistryDef[] = [
      { entity: "questionnaire", key: "y", labelHe: "y", type: "number", schema: { type: "text" } },
    ];
    expect(() => assertRegistryValid(bad)).toThrow(/type/i);
  });

  it("rejects charted=true without a chartedColumn (ADR-004 rule 3)", () => {
    const bad: RegistryDef[] = [
      {
        entity: "metric",
        key: "w",
        labelHe: "משקל",
        type: "number",
        schema: { type: "number" },
        charted: true,
      },
    ];
    expect(() => assertRegistryValid(bad)).toThrow(/chartedColumn/);
  });
});

describe("store (DB)", () => {
  let db: Db;
  let t1: string;
  let p1: string;

  beforeEach(async () => {
    db = await createTestDb();
    const [t] = await db
      .insert(therapist)
      .values({ name: "נופר", email: "n@ex.co" })
      .returning({ id: therapist.id });
    t1 = t.id;
    // field_value.patient_id now has an FK -> patient (migration 0021)
    const [p] = await db
      .insert(patient)
      .values({ therapistId: t1, firstName: "בדיקה", lastName: "מטופל" })
      .returning({ id: patient.id });
    p1 = p.id;
    await loadRegistry(db, t1);
  });

  it("field_definition.schema is NOT NULL — a definition without a schema is rejected", async () => {
    await expect(
      db.insert(fieldDefinition).values({
        therapistId: t1,
        entity: "questionnaire",
        key: "noschema",
        labelHe: "x",
        type: "text",
        schema: null as unknown as object,
      }),
    ).rejects.toThrowError();
  });

  it("setFieldValues validates on write; getFieldValues re-validates on read", async () => {
    const defs = await db
      .select()
      .from(fieldDefinition)
      .where(
        and(eq(fieldDefinition.therapistId, t1), eq(fieldDefinition.entity, "treatment_session")),
      );
    const energy = defs.find((d) => d.key === "energy_level")!;
    const weight = defs.find((d) => d.key === "weight_kg")!;
    const scope = { therapistId: t1, patientId: p1 };
    const sessionId = crypto.randomUUID();

    await setFieldValues(db, scope, "treatment_session", sessionId, [
      { definitionId: energy.id, value: 7 },
      { definitionId: weight.id, value: 72.4 },
    ]);

    const out = await getFieldValues(db, scope, "treatment_session", sessionId);
    expect(out.map((o) => o.key)).toEqual(["energy_level", "weight_kg"]);
    expect(out.find((o) => o.key === "energy_level")?.value).toBe(7);

    // invalid write is rejected, nothing persisted
    await expect(
      setFieldValues(db, scope, "treatment_session", sessionId, [
        { definitionId: energy.id, value: 99 },
      ]),
    ).rejects.toBeInstanceOf(FieldValidationError);

    // a corrupt row (inserted past the validator on write) is NOT re-validated
    // away on read — it must not 500 the screen, so the raw value comes back
    const corruptEntityId = crypto.randomUUID();
    await db.insert(fieldValue).values({
      therapistId: t1,
      patientId: scope.patientId,
      entity: "treatment_session",
      entityId: corruptEntityId,
      definitionId: energy.id,
      value: "not a number",
    });
    const lenient = await getFieldValues(db, scope, "treatment_session", corruptEntityId);
    expect(lenient[0]?.value).toBe("not a number");
  });
});
