// @vitest-environment node
/**
 * Isolation for the intake Questionnaire module (WP-18). The patient fills it,
 * the therapist reads it; answers live in `field_value` scoped to the therapist,
 * and nothing crosses the tenant line.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type TherapistDb, type PatientDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import { loadRegistryInto, getFieldValuesFrom } from "@/modules/core/fields";
import {
  getQuestionnaire,
  submitQuestionnaire,
  questionnaireFieldDefs,
} from "@/modules/questionnaires";

let db: Db;
let t1: string;
let t2: string;
let A: string;
let B: string;

function tdb(therapistId: string): TherapistDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "therapist",
    therapistId,
    patientId: null,
    expiresAt: new Date(Date.now() + 1e4),
  }) as TherapistDb;
}
function pdb(therapistId: string, patientId: string): PatientDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "patient",
    therapistId,
    patientId,
    expiresAt: new Date(Date.now() + 1e4),
  }) as PatientDb;
}

async function defId(therapistId: string, key: string): Promise<string> {
  const defs = await questionnaireFieldDefs(tdb(therapistId));
  return defs.find((d) => d.key === key)!.id;
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
  await loadRegistryInto(db, t1);
  await loadRegistryInto(db, t2);
  [A, B] = (
    await db
      .insert(patient)
      .values([
        { therapistId: t1, firstName: "איי", lastName: "בדיקה" },
        { therapistId: t2, firstName: "בי", lastName: "בדיקה" },
      ])
      .returning({ id: patient.id })
  ).map((r) => r.id);
});

describe("fill + read", () => {
  it("a patient submit lands answers, marks submitted, and fires a timeline event", async () => {
    const goal = await defId(t1, "main_goal");
    const energy = await defId(t1, "daily_energy");

    const { responseId } = await submitQuestionnaire(pdb(t1, A), A, [
      { definitionId: goal, value: "לרדת 4 קילו" },
      { definitionId: energy, value: 6 },
    ]);

    const view = await getQuestionnaire(tdb(t1), A);
    expect(view?.response.status).toBe("submitted");
    expect(view?.response.submittedAt).toBeInstanceOf(Date);
    expect(view?.fields.find((f) => f.key === "main_goal")?.value).toBe("לרדת 4 קילו");
    expect(view?.fields.find((f) => f.key === "daily_energy")?.value).toBe(6);

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl.filter((e) => e.type === "questionnaire_submitted")).toHaveLength(1);
    expect(tl[0].refId).toBe(responseId);
  });

  it("re-submitting updates answers and re-fires the event; still one response", async () => {
    const goal = await defId(t1, "main_goal");
    await submitQuestionnaire(pdb(t1, A), A, [{ definitionId: goal, value: "גרסה 1" }]);
    await submitQuestionnaire(pdb(t1, A), A, [{ definitionId: goal, value: "גרסה 2" }]);

    const view = await getQuestionnaire(tdb(t1), A);
    expect(view?.fields.find((f) => f.key === "main_goal")?.value).toBe("גרסה 2");

    const responses = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(responses.filter((e) => e.type === "questionnaire_submitted")).toHaveLength(2);
  });

  it("rejects an answer outside the field schema", async () => {
    const meals = await defId(t1, "meals_per_day"); // 1..12 integer
    await expect(
      submitQuestionnaire(pdb(t1, A), A, [{ definitionId: meals, value: 99 }]),
    ).rejects.toThrow();
  });
});

describe("cross-tenant", () => {
  it("a therapist only sees their own patient's questionnaire", async () => {
    const goal1 = await defId(t1, "main_goal");
    await submitQuestionnaire(pdb(t1, A), A, [{ definitionId: goal1, value: "של איי" }]);

    expect(await getQuestionnaire(tdb(t1), B)).toBeNull();
    expect(await getQuestionnaire(tdb(t2), A)).toBeNull();
  });

  it("answers in field_value are scoped to therapist AND patient", async () => {
    const goal = await defId(t1, "main_goal");
    const { responseId } = await submitQuestionnaire(pdb(t1, A), A, [
      { definitionId: goal, value: "פרטי" },
    ]);

    expect(
      await getFieldValuesFrom({ therapistId: t1, patientId: A }, "questionnaire", responseId),
    ).toHaveLength(1);
    expect(
      await getFieldValuesFrom({ therapistId: t2, patientId: B }, "questionnaire", responseId),
    ).toEqual([]);
    // same therapist, another patient -> nothing (WP-22 hardening)
    expect(
      await getFieldValuesFrom({ therapistId: t1, patientId: B }, "questionnaire", responseId),
    ).toEqual([]);
  });

  it("a patient handle pointed at another patient still only writes its own response", async () => {
    const goal = await defId(t1, "main_goal");
    // pdb for A, but passing B's id — the guard forces patient_id = A
    await submitQuestionnaire(pdb(t1, A), B, [{ definitionId: goal, value: "smuggled" }]);

    expect(await getQuestionnaire(tdb(t2), B)).toBeNull(); // nothing created for B
    expect((await getQuestionnaire(tdb(t1), A))?.fields[0]?.value).toBe("smuggled");
  });
});
