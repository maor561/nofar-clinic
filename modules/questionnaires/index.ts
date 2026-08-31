import { eq, type InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { recordEvent } from "@/modules/patient-file";
import {
  fieldDefinitionsFor,
  setFieldValuesIn,
  getFieldValuesFrom,
  type FieldValueOut,
} from "@/modules/core/fields";
import { questionnaireResponse } from "./schema";

export { questionnaireStatus, type QuestionnaireStatus } from "./schema";

export const QUESTIONNAIRE_FIELD_ENTITY = "questionnaire" as const;

type AnyScoped = TherapistDb | PatientDb;

export type ResponseRow = InferSelectModel<typeof questionnaireResponse>;
export type QuestionnaireView = { response: ResponseRow; fields: FieldValueOut[] } | null;

export type FieldWriteInput = { definitionId: string; value: unknown };

/** Field definitions that make up the intake questionnaire, ordered. */
export function questionnaireFieldDefs(db: AnyScoped) {
  return fieldDefinitionsFor((db as TherapistDb).therapistId, QUESTIONNAIRE_FIELD_ENTITY);
}

async function findResponse(db: AnyScoped, patientId: string): Promise<ResponseRow | null> {
  return (db as TherapistDb).findOne(
    questionnaireResponse,
    eq(questionnaireResponse.patientId, patientId),
  );
}

/** Patient-side: the response, creating an empty `open` one on first visit. */
export async function startResponse(pdb: PatientDb, patientId: string): Promise<ResponseRow> {
  const existing = await findResponse(pdb, patientId);
  if (existing) return existing;
  const [row] = await pdb.insert(questionnaireResponse, { patientId });
  return row;
}

/** The response + its answers. `null` if the patient hasn't started it. */
export async function getQuestionnaire(
  db: AnyScoped,
  patientId: string,
): Promise<QuestionnaireView> {
  const response = await findResponse(db, patientId);
  if (!response) return null;
  const fields = await getFieldValuesFrom(
    (db as TherapistDb).therapistId,
    QUESTIONNAIRE_FIELD_ENTITY,
    response.id,
  );
  return { response, fields };
}

/**
 * Patient submits (or re-submits) the questionnaire. Writes every answer to
 * `field_value`, flips the status to `submitted`, and drops a
 * `questionnaire_submitted` timeline event.
 */
export async function submitQuestionnaire(
  pdb: PatientDb,
  patientId: string,
  answers: FieldWriteInput[],
): Promise<{ responseId: string; therapistId: string }> {
  const response = await startResponse(pdb, patientId);

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

  await recordEvent(pdb, {
    patientId,
    type: "questionnaire_submitted",
    summary: "שאלון קליטה הוגש",
    refId: response.id,
  });

  return { responseId: response.id, therapistId: pdb.therapistId };
}
