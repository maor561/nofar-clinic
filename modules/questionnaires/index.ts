import { and, asc, desc, eq, inArray, type InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { recordEvent } from "@/modules/patient-file";
import {
  fieldDefinitionsFor,
  setFieldValuesIn,
  getFieldValuesFrom,
  type FieldValueOut,
} from "@/modules/core/fields";
import { questionnaireResponse, questionnaireTemplate } from "./schema";
import { templateConfigByIds, type TemplateConfig } from "./internal/template-config";

export { questionnaireStatus, type QuestionnaireStatus } from "./schema";
export type { TemplateConfig } from "./internal/template-config";

export const QUESTIONNAIRE_FIELD_ENTITY = "questionnaire" as const;

type AnyScoped = TherapistDb | PatientDb;

export type TemplateRow = InferSelectModel<typeof questionnaireTemplate>;
export type ResponseRow = InferSelectModel<typeof questionnaireResponse>;
export type FieldWriteInput = { definitionId: string; value: unknown };

/* --------------------------------------------------------------------------- *
 *  Templates (the library) — therapist-scoped
 * --------------------------------------------------------------------------- */

export async function listTemplates(
  tdb: TherapistDb,
  opts: { includeInactive?: boolean } = {},
): Promise<TemplateRow[]> {
  return tdb.list(questionnaireTemplate, {
    where: opts.includeInactive ? undefined : eq(questionnaireTemplate.active, true),
    orderBy: [asc(questionnaireTemplate.sortOrder), asc(questionnaireTemplate.createdAt)],
    limit: 200,
  });
}

export async function getTemplate(tdb: TherapistDb, id: string): Promise<TemplateRow | null> {
  return tdb.findOne(questionnaireTemplate, eq(questionnaireTemplate.id, id));
}

export async function createTemplate(
  tdb: TherapistDb,
  input: { name: string; descriptionHe?: string | null },
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (name.length < 2) throw new Error("invalid_name");
  const dupe = await tdb.findOne(questionnaireTemplate, eq(questionnaireTemplate.name, name));
  if (dupe) throw new Error("duplicate");
  const rows = await tdb.list(questionnaireTemplate, {
    orderBy: [desc(questionnaireTemplate.sortOrder)],
    limit: 1,
  });
  const [row] = await tdb.insert(questionnaireTemplate, {
    name,
    descriptionHe: input.descriptionHe?.trim() || null,
    sortOrder: (rows[0]?.sortOrder ?? 0) + 10,
  });
  return { id: row.id };
}

export async function updateTemplate(
  tdb: TherapistDb,
  id: string,
  patch: { name?: string; descriptionHe?: string | null; active?: boolean },
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (n.length < 2) throw new Error("invalid_name");
    set.name = n;
  }
  if (patch.descriptionHe !== undefined) set.descriptionHe = patch.descriptionHe?.trim() || null;
  if (patch.active !== undefined) set.active = patch.active;
  if (Object.keys(set).length === 0) return;
  const rows = await tdb.update(questionnaireTemplate, set, eq(questionnaireTemplate.id, id));
  if (rows.length === 0) throw new Error("not_found");
}

/** The questions of one template, ordered — for the settings editor and the form. */
export function templateQuestions(db: AnyScoped, templateId: string) {
  return fieldDefinitionsFor(
    (db as TherapistDb).therapistId,
    QUESTIONNAIRE_FIELD_ENTITY,
    templateId,
  );
}

/* --------------------------------------------------------------------------- *
 *  Assignment + responses — dual-scoped
 * --------------------------------------------------------------------------- */

export type PatientQuestionnaire = ResponseRow & { templateName: string | null };

/** Every questionnaire assigned to a patient, newest template first. */
export async function listPatientQuestionnaires(
  db: AnyScoped,
  patientId: string,
): Promise<PatientQuestionnaire[]> {
  const responses = await (db as TherapistDb).list(questionnaireResponse, {
    where: eq(questionnaireResponse.patientId, patientId),
    orderBy: [asc(questionnaireResponse.createdAt)],
    limit: 100,
  });
  if (responses.length === 0) return [];
  const templateIds = responses.map((r) => r.templateId).filter((x): x is string => x != null);
  const byId = await templateConfigByIds(responses[0].therapistId, templateIds);
  return responses.map((r) => ({
    ...r,
    templateName: r.templateId ? (byId.get(r.templateId)?.name ?? "שאלון") : "שאלון קליטה",
  }));
}

/** Assign one or more library questionnaires to a patient (idempotent per template). */
export async function assignQuestionnaires(
  tdb: TherapistDb,
  patientId: string,
  templateIds: string[],
): Promise<number> {
  const ids = [...new Set(templateIds)];
  if (ids.length === 0) return 0;

  const templates = await tdb.findMany(
    questionnaireTemplate,
    inArray(questionnaireTemplate.id, ids),
  );
  if (templates.length !== ids.length) throw new Error("template_not_found");

  const existing = await tdb.list(questionnaireResponse, {
    where: eq(questionnaireResponse.patientId, patientId),
  });
  const have = new Set(existing.map((r) => r.templateId));

  let added = 0;
  for (const id of ids) {
    if (have.has(id)) continue;
    await tdb.insert(questionnaireResponse, { patientId, templateId: id, status: "open" });
    added++;
  }
  return added;
}

/** Remove an assignment (only while still open — a submitted one is kept). */
export async function unassignQuestionnaire(tdb: TherapistDb, responseId: string): Promise<void> {
  await tdb.delete(
    questionnaireResponse,
    and(eq(questionnaireResponse.id, responseId), eq(questionnaireResponse.status, "open"))!,
  );
}

export type QuestionnaireDetail = {
  response: ResponseRow;
  template: TemplateConfig | null;
  fields: FieldValueOut[];
};

/**
 * One response (guard-scoped) with its template config + current answers. The
 * response and its `field_value` answers go through the scoping guard; only the
 * non-sensitive template label/intro is read raw (see internal/template-config).
 */
export async function getResponseDetail(
  db: AnyScoped,
  responseId: string,
): Promise<QuestionnaireDetail | null> {
  const response = await (db as TherapistDb).findOne(
    questionnaireResponse,
    eq(questionnaireResponse.id, responseId),
  );
  if (!response) return null;
  const [byId, fields] = await Promise.all([
    response.templateId
      ? templateConfigByIds(response.therapistId, [response.templateId])
      : Promise.resolve(new Map<string, TemplateConfig>()),
    getFieldValuesFrom(
      { therapistId: response.therapistId, patientId: response.patientId },
      QUESTIONNAIRE_FIELD_ENTITY,
      response.id,
    ),
  ]);
  return {
    response,
    template: response.templateId ? (byId.get(response.templateId) ?? null) : null,
    fields,
  };
}

/**
 * Patient submits (or re-submits) one questionnaire. Answers go to `field_value`
 * through the single validator; status flips to `submitted`; a timeline event
 * fires on the first submission.
 */
export async function submitResponse(
  pdb: PatientDb,
  responseId: string,
  answers: FieldWriteInput[],
): Promise<{ responseId: string; templateId: string | null; firstSubmit: boolean }> {
  const response = await pdb.findOne(
    questionnaireResponse,
    eq(questionnaireResponse.id, responseId),
  );
  if (!response) throw new Error("not_found");
  // the guard already pinned patient_id to the caller — trust that, not any arg
  const patientId = response.patientId;
  const firstSubmit = response.status !== "submitted";

  if (answers.length) {
    await setFieldValuesIn(
      { therapistId: pdb.therapistId, patientId },
      QUESTIONNAIRE_FIELD_ENTITY,
      response.id,
      answers,
    );
  }

  await pdb.update(
    questionnaireResponse,
    { status: "submitted", submittedAt: new Date(), updatedAt: new Date() },
    eq(questionnaireResponse.id, response.id),
  );

  if (firstSubmit) {
    const name = response.templateId
      ? ((await templateConfigByIds(response.therapistId, [response.templateId])).get(
          response.templateId,
        )?.name ?? "שאלון")
      : "שאלון קליטה";
    await recordEvent(pdb, {
      patientId,
      type: "questionnaire_submitted",
      summary: `${name} הוגש`,
      refId: response.id,
    });
  }

  return { responseId: response.id, templateId: response.templateId, firstSubmit };
}

/** How many of the patient's questionnaires are still open (for the dashboard nudge). */
export async function countOpenQuestionnaires(db: AnyScoped, patientId: string): Promise<number> {
  return (db as TherapistDb).count(
    questionnaireResponse,
    and(eq(questionnaireResponse.patientId, patientId), eq(questionnaireResponse.status, "open"))!,
  );
}
