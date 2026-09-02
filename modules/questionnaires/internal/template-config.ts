import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/modules/core/data/client";
import { questionnaireTemplate } from "../schema";

/**
 * Raw reads of `questionnaire_template` — pure THERAPIST CONFIGURATION (name,
 * intro text, active flag), never patient data. Same rationale as
 * `core/fields.fieldDefinitionsFor`: the patient-facing screens need the label
 * and the intro to render a form, and a `PatientDb` can't touch a table with no
 * `patient_id`. Every call is still filtered by a `therapistId` that the caller
 * obtained from a guard-scoped row.
 */

export type TemplateConfig = {
  id: string;
  name: string;
  descriptionHe: string | null;
  active: boolean;
  sortOrder: number;
};

export async function listTemplateConfig(
  therapistId: string,
  opts: { includeInactive?: boolean } = {},
): Promise<TemplateConfig[]> {
  const conds = [eq(questionnaireTemplate.therapistId, therapistId)];
  if (!opts.includeInactive) conds.push(eq(questionnaireTemplate.active, true));
  return getDb()
    .select({
      id: questionnaireTemplate.id,
      name: questionnaireTemplate.name,
      descriptionHe: questionnaireTemplate.descriptionHe,
      active: questionnaireTemplate.active,
      sortOrder: questionnaireTemplate.sortOrder,
    })
    .from(questionnaireTemplate)
    .where(and(...conds))
    .orderBy(asc(questionnaireTemplate.sortOrder), asc(questionnaireTemplate.createdAt));
}

export async function templateConfigByIds(
  therapistId: string,
  ids: string[],
): Promise<Map<string, TemplateConfig>> {
  if (ids.length === 0) return new Map();
  const rows = await getDb()
    .select({
      id: questionnaireTemplate.id,
      name: questionnaireTemplate.name,
      descriptionHe: questionnaireTemplate.descriptionHe,
      active: questionnaireTemplate.active,
      sortOrder: questionnaireTemplate.sortOrder,
    })
    .from(questionnaireTemplate)
    .where(
      and(
        eq(questionnaireTemplate.therapistId, therapistId),
        inArray(questionnaireTemplate.id, ids),
      ),
    );
  return new Map(rows.map((r) => [r.id, r]));
}
