// @vitest-environment node
/**
 * Isolation for the food diary (WP-69). A patient writes meals + their note;
 * the therapist writes a feedback note; neither handle reaches another tenant's
 * rows, and the patient's own scope is forced by the guard.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type TherapistDb, type PatientDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import {
  getFoodDay,
  listFoodDays,
  saveFoodDay,
  setTherapistNote,
  countLoggedDays,
} from "@/modules/food-log";

let db: Db;
let t1: string;
let t2: string;
let A: string;
let B: string;

function tdb(id: string): TherapistDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "therapist",
    therapistId: id,
    patientId: null,
    expiresAt: new Date(Date.now() + 1e4),
  }) as TherapistDb;
}
function pdb(tid: string, pid: string): PatientDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "patient",
    therapistId: tid,
    patientId: pid,
    expiresAt: new Date(Date.now() + 1e4),
  }) as PatientDb;
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
  [A, B] = (
    await db
      .insert(patient)
      .values([
        { therapistId: t1, firstName: "איי", lastName: "ב" },
        { therapistId: t2, firstName: "בי", lastName: "ב" },
      ])
      .returning({ id: patient.id })
  ).map((r) => r.id);
});

describe("food diary", () => {
  it("a patient saves meals; a first entry fires one timeline event", async () => {
    const r1 = await saveFoodDay(pdb(t1, A), "2026-09-01", {
      breakfast: "יוגורט וגרנולה",
      patientNote: "רעב בערב",
    });
    expect(r1.firstEntry).toBe(true);

    const day = await getFoodDay(tdb(t1), A, "2026-09-01");
    expect(day?.breakfast).toBe("יוגורט וגרנולה");
    expect(day?.patientNote).toBe("רעב בערב");

    // editing again is not a "first entry"
    const r2 = await saveFoodDay(pdb(t1, A), "2026-09-01", { lunch: "סלט" });
    expect(r2.firstEntry).toBe(false);
    expect((await getFoodDay(tdb(t1), A, "2026-09-01"))?.lunch).toBe("סלט");
    expect((await getFoodDay(tdb(t1), A, "2026-09-01"))?.breakfast).toBe("יוגורט וגרנולה");

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl.filter((e) => e.type === "food_log")).toHaveLength(1);
  });

  it("the therapist note is stored and visible to the patient", async () => {
    await saveFoodDay(pdb(t1, A), "2026-09-02", { breakfast: "x" });
    await setTherapistNote(tdb(t1), A, "2026-09-02", "פחות סוכר בבוקר");
    const asPatient = await getFoodDay(pdb(t1, A), A, "2026-09-02");
    expect(asPatient?.therapistNote).toBe("פחות סוכר בבוקר");
    expect(asPatient?.therapistNoteAt).toBeInstanceOf(Date);
  });

  it("nothing crosses the tenant line", async () => {
    await saveFoodDay(pdb(t1, A), "2026-09-03", { breakfast: "של איי" });

    expect(await listFoodDays(tdb(t2), A)).toEqual([]);
    expect(await getFoodDay(tdb(t2), A, "2026-09-03")).toBeNull();
    // t2's patient handle can't read A's day either
    expect(await getFoodDay(pdb(t2, B), A, "2026-09-03")).toBeNull();
  });

  it("countLoggedDays counts only days with real content", async () => {
    await saveFoodDay(pdb(t1, A), "2026-09-01", { breakfast: "a" });
    await saveFoodDay(pdb(t1, A), "2026-09-02", { lunch: "b" });
    await setTherapistNote(tdb(t1), A, "2026-09-05", "note only, patient wrote nothing");
    expect(await countLoggedDays(tdb(t1), A, "2026-09-01", "2026-09-30")).toBe(2);
  });
});
