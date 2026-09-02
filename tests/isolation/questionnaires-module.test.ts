// @vitest-environment node
/**
 * Isolation for the Questionnaire library (WP-18 / WP-67). A therapist defines
 * templates and assigns >=1 to a patient; the patient fills each; answers live
 * in `field_value` scoped to therapist AND patient, and nothing crosses the
 * tenant line.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type TherapistDb, type PatientDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import { createManagedFieldDef, getFieldValuesFrom } from "@/modules/core/fields";
import {
  createTemplate,
  listTemplates,
  templateQuestions,
  assignQuestionnaires,
  listPatientQuestionnaires,
  getResponseDetail,
  submitResponse,
  countOpenQuestionnaires,
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

/** A template with a text question + a required scale question. Returns ids. */
async function makeTemplate(therapistId: string, name: string) {
  const { id: templateId } = await createTemplate(tdb(therapistId), { name });
  const goal = await createManagedFieldDef(
    therapistId,
    "questionnaire",
    { labelHe: "מטרת הטיפול", type: "text" },
    templateId,
  );
  const energy = await createManagedFieldDef(
    therapistId,
    "questionnaire",
    { labelHe: "רמת אנרגיה", type: "scale", min: 1, max: 5, required: true },
    templateId,
  );
  return { templateId, goal, energy };
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
        { therapistId: t1, firstName: "איי", lastName: "בדיקה" },
        { therapistId: t2, firstName: "בי", lastName: "בדיקה" },
      ])
      .returning({ id: patient.id })
  ).map((r) => r.id);
});

describe("templates + assignment", () => {
  it("templates and their questions are per therapist", async () => {
    const { templateId } = await makeTemplate(t1, "שאלון נטורופתי");
    await makeTemplate(t2, "שאלון של אחר");

    expect((await listTemplates(tdb(t1))).map((x) => x.name)).toEqual(["שאלון נטורופתי"]);
    expect((await listTemplates(tdb(t2))).map((x) => x.name)).toEqual(["שאלון של אחר"]);
    const qs = await templateQuestions(tdb(t1), templateId);
    expect(qs.map((q) => q.labelHe)).toEqual(["מטרת הטיפול", "רמת אנרגיה"]);
  });

  it("assigning >=1 template creates one open response each, idempotently", async () => {
    const a = await makeTemplate(t1, "שאלון א");
    const b = await makeTemplate(t1, "שאלון ב");

    const added = await assignQuestionnaires(tdb(t1), A, [a.templateId, b.templateId]);
    expect(added).toBe(2);
    // running again adds nothing
    expect(await assignQuestionnaires(tdb(t1), A, [a.templateId, b.templateId])).toBe(0);

    const list = await listPatientQuestionnaires(tdb(t1), A);
    expect(list.map((q) => q.templateName).sort()).toEqual(["שאלון א", "שאלון ב"]);
    expect(list.every((q) => q.status === "open")).toBe(true);
    expect(await countOpenQuestionnaires(tdb(t1), A)).toBe(2);
  });

  it("cannot assign another therapist's template", async () => {
    const other = await makeTemplate(t2, "לא שלי");
    await expect(assignQuestionnaires(tdb(t1), A, [other.templateId])).rejects.toThrow(
      "template_not_found",
    );
  });
});

describe("fill + read", () => {
  it("a patient submit lands answers, marks submitted, fires one timeline event", async () => {
    const { templateId, goal, energy } = await makeTemplate(t1, "קליטה");
    await assignQuestionnaires(tdb(t1), A, [templateId]);
    const [{ id: rid }] = await listPatientQuestionnaires(pdb(t1, A), A);

    const res = await submitResponse(pdb(t1, A), rid, [
      { definitionId: goal, value: "לרדת 4 קילו" },
      { definitionId: energy, value: 4 },
    ]);
    expect(res.firstSubmit).toBe(true);

    const detail = await getResponseDetail(tdb(t1), rid);
    expect(detail?.response.status).toBe("submitted");
    expect(detail?.template?.name).toBe("קליטה");
    expect(detail?.fields.map((f) => f.value)).toEqual(["לרדת 4 קילו", 4]);

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl.filter((e) => e.type === "questionnaire_submitted")).toHaveLength(1);
    expect(tl[0].refId).toBe(rid);
  });

  it("re-submitting updates answers; no second timeline event; still one response", async () => {
    const { templateId, goal } = await makeTemplate(t1, "קליטה");
    await assignQuestionnaires(tdb(t1), A, [templateId]);
    const [{ id: rid }] = await listPatientQuestionnaires(pdb(t1, A), A);

    await submitResponse(pdb(t1, A), rid, [{ definitionId: goal, value: "גרסה 1" }]);
    const second = await submitResponse(pdb(t1, A), rid, [{ definitionId: goal, value: "גרסה 2" }]);
    expect(second.firstSubmit).toBe(false);

    const detail = await getResponseDetail(tdb(t1), rid);
    expect(detail?.fields[0].value).toBe("גרסה 2");
    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl.filter((e) => e.type === "questionnaire_submitted")).toHaveLength(1);
  });

  it("rejects an answer outside the question schema", async () => {
    const { templateId, energy } = await makeTemplate(t1, "קליטה");
    await assignQuestionnaires(tdb(t1), A, [templateId]);
    const [{ id: rid }] = await listPatientQuestionnaires(pdb(t1, A), A);
    await expect(
      submitResponse(pdb(t1, A), rid, [{ definitionId: energy, value: 99 }]),
    ).rejects.toThrow();
  });
});

describe("cross-tenant", () => {
  it("a therapist only sees their own patient's questionnaires", async () => {
    const { templateId } = await makeTemplate(t1, "קליטה");
    await assignQuestionnaires(tdb(t1), A, [templateId]);

    expect(await listPatientQuestionnaires(tdb(t1), B)).toEqual([]);
    expect(await listPatientQuestionnaires(tdb(t2), A)).toEqual([]);
  });

  it("answers in field_value are scoped to therapist AND patient", async () => {
    const { templateId, goal } = await makeTemplate(t1, "קליטה");
    await assignQuestionnaires(tdb(t1), A, [templateId]);
    const [{ id: rid }] = await listPatientQuestionnaires(pdb(t1, A), A);
    await submitResponse(pdb(t1, A), rid, [{ definitionId: goal, value: "פרטי" }]);

    expect(
      await getFieldValuesFrom({ therapistId: t1, patientId: A }, "questionnaire", rid),
    ).toHaveLength(1);
    expect(
      await getFieldValuesFrom({ therapistId: t2, patientId: B }, "questionnaire", rid),
    ).toEqual([]);
    expect(
      await getFieldValuesFrom({ therapistId: t1, patientId: B }, "questionnaire", rid),
    ).toEqual([]);
  });

  it("a patient handle can't read a response that isn't theirs", async () => {
    const { templateId } = await makeTemplate(t1, "קליטה");
    await assignQuestionnaires(tdb(t1), A, [templateId]);
    const [{ id: rid }] = await listPatientQuestionnaires(tdb(t1), A);
    // B's patient handle (under t1) must not reach A's response row
    expect(await getResponseDetail(pdb(t1, B), rid)).toBeNull();
  });
});
