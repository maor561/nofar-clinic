// @vitest-environment node
/**
 * Isolation for therapist-managed treatment types (WP-55). The list is
 * per-therapist; a rename propagates to that therapist's records only.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type TherapistDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient, patientTreatmentType } from "@/modules/patients/schema";
import {
  listTreatmentTypes,
  createTreatmentType,
  renameTreatmentType,
  setTreatmentTypeActive,
} from "@/modules/patients";

let db: Db;
let t1: string;
let t2: string;
let A: string;

function tdb(id: string): TherapistDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "therapist",
    therapistId: id,
    patientId: null,
    expiresAt: new Date(Date.now() + 1e4),
  }) as TherapistDb;
}

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
  [A] = (
    await db
      .insert(patient)
      .values([{ therapistId: t1, firstName: "איי", lastName: "בדיקה" }])
      .returning({ id: patient.id })
  ).map((r) => r.id);
});

describe("treatment types", () => {
  it("are created and listed per therapist", async () => {
    await createTreatmentType(tdb(t1), "רפלקסולוגיה");
    await createTreatmentType(tdb(t1), "עיסוי");
    await createTreatmentType(tdb(t2), "תזונה");

    const mine = await listTreatmentTypes(tdb(t1));
    expect(mine.map((r) => r.name)).toEqual(["רפלקסולוגיה", "עיסוי"]);
    expect(await listTreatmentTypes(tdb(t2))).toHaveLength(1);
  });

  it("rejects a duplicate name", async () => {
    await createTreatmentType(tdb(t1), "תזונה");
    await expect(createTreatmentType(tdb(t1), "תזונה")).rejects.toThrow("duplicate");
  });

  it("deactivating hides a type from the active list but keeps the row", async () => {
    await createTreatmentType(tdb(t1), "עיסוי");
    const [row] = await listTreatmentTypes(tdb(t1));
    await setTreatmentTypeActive(tdb(t1), row.id, false);
    expect(await listTreatmentTypes(tdb(t1))).toHaveLength(0);
    expect(await listTreatmentTypes(tdb(t1), { includeInactive: true })).toHaveLength(1);
  });

  it("rename propagates to that therapist's patient_treatment_type rows", async () => {
    await createTreatmentType(tdb(t1), "רפלקסולוגיה");
    const [row] = await listTreatmentTypes(tdb(t1));
    await db.insert(patientTreatmentType).values({
      patientId: A,
      therapistId: t1,
      treatmentType: "רפלקסולוגיה",
    });

    await renameTreatmentType(tdb(t1), row.id, "רפלקסולוגיה קלינית");

    const ptt = await db
      .select()
      .from(patientTreatmentType)
      .where(eq(patientTreatmentType.patientId, A));
    expect(ptt[0].treatmentType).toBe("רפלקסולוגיה קלינית");
    expect((await listTreatmentTypes(tdb(t1)))[0].name).toBe("רפלקסולוגיה קלינית");
  });
});
