// @vitest-environment node
/**
 * Isolation + guardrails for therapist-managed field definitions (WP-60).
 * The list is per-therapist; every schema still passes through the single
 * validator before it can be stored.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { therapist } from "@/modules/core/auth/schema";
import {
  listFieldDefs,
  createFieldDef,
  updateFieldDef,
  FieldDefError,
} from "@/modules/core/fields/internal/manage";
import { compileFieldSchema } from "@/modules/core/fields";
import { fieldDefinition } from "@/modules/core/fields/schema";
import { eq } from "drizzle-orm";

let db: Db;
let t1: string;
let t2: string;

beforeEach(async () => {
  db = await createTestDb();
  [t1, t2] = (
    await db
      .insert(therapist)
      .values([
        { name: "נופר", email: "n@ex.co" },
        { name: "אחר", email: "o@ex.co" },
      ])
      .returning({ id: therapist.id })
  ).map((r) => r.id);
});

describe("managed field definitions", () => {
  it("are created per therapist and never leak across therapists", async () => {
    await createFieldDef(db, t1, "treatment_session", {
      labelHe: "לחץ דם",
      type: "number",
      unit: "mmHg",
      min: 40,
      max: 250,
    });
    await createFieldDef(db, t2, "treatment_session", { labelHe: "מצב רוח", type: "scale" });

    const mine = await listFieldDefs(db, t1, "treatment_session");
    expect(mine.map((d) => d.labelHe)).toEqual(["לחץ דם"]);
    const theirs = await listFieldDefs(db, t2, "treatment_session");
    expect(theirs.map((d) => d.labelHe)).toEqual(["מצב רוח"]);
  });

  it("compiles the schema — a malformed definition is rejected before insert", async () => {
    await expect(
      createFieldDef(db, t1, "treatment_session", {
        labelHe: "טווח הפוך",
        type: "number",
        min: 100,
        max: 10,
      }),
    ).rejects.toBeInstanceOf(FieldDefError);
    await expect(
      createFieldDef(db, t1, "treatment_session", {
        labelHe: "בחירה ריקה",
        type: "select",
        options: ["רק אחת"],
      }),
    ).rejects.toBeInstanceOf(FieldDefError);
    // nothing persisted
    expect(await listFieldDefs(db, t1, "treatment_session")).toHaveLength(0);
  });

  it("the stored schema round-trips through compileFieldSchema", async () => {
    await createFieldDef(db, t1, "treatment_session", {
      labelHe: "היקף מותניים",
      type: "number",
      unit: "ס״מ",
      min: 30,
      max: 200,
      required: true,
    });
    const [row] = await db
      .select()
      .from(fieldDefinition)
      .where(eq(fieldDefinition.therapistId, t1));
    expect(row.charted).toBe(false);
    expect(() => compileFieldSchema(row.schema)).not.toThrow();
  });

  it("rejects a duplicate label within the same therapist + entity", async () => {
    await createFieldDef(db, t1, "treatment_session", { labelHe: "דופק", type: "number" });
    await expect(
      createFieldDef(db, t1, "treatment_session", { labelHe: "דופק", type: "scale" }),
    ).rejects.toThrow("duplicate_label");
  });

  it("deactivating hides a definition from the active list but keeps the row", async () => {
    await createFieldDef(db, t1, "treatment_session", { labelHe: "שינה", type: "scale" });
    const [row] = await listFieldDefs(db, t1, "treatment_session");
    await updateFieldDef(db, t1, row.id, { active: false });
    expect(await listFieldDefs(db, t1, "treatment_session")).toHaveLength(0);
    expect(
      await listFieldDefs(db, t1, "treatment_session", { includeInactive: true }),
    ).toHaveLength(1);
  });

  it("one therapist cannot edit another therapist's definition", async () => {
    const id = await createFieldDef(db, t1, "treatment_session", {
      labelHe: "טמפרטורה",
      type: "number",
    });
    await updateFieldDef(db, t2, id, { labelHe: "שונה" });
    const [row] = await listFieldDefs(db, t1, "treatment_session");
    expect(row.labelHe).toBe("טמפרטורה");
  });
});
