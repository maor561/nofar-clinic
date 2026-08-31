import { desc, eq, type InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { patient } from "@/modules/patients/schema";
import { recordEvent } from "@/modules/patient-file";
import {
  fieldDefinitionsFor,
  setFieldValuesIn,
  getFieldValuesFrom,
  type FieldValueOut,
} from "@/modules/core/fields";
import { treatmentPlan, treatmentPlanVersion } from "./schema";

export const PLAN_FIELD_ENTITY = "plan_version" as const;

type AnyScoped = TherapistDb | PatientDb;

export type PlanRow = InferSelectModel<typeof treatmentPlan>;
export type PlanVersionRow = InferSelectModel<typeof treatmentPlanVersion>;
export type PlanVersionDetail = PlanVersionRow & { fields: FieldValueOut[] };
export type PlanView = {
  plan: PlanRow;
  current: PlanVersionDetail | null;
  versionCount: number;
};

export type FieldWriteInput = { definitionId: string; value: unknown };

/** Definitions for the structured plan content (rendered with <FieldInput>). */
export function planFieldDefs(db: AnyScoped) {
  return fieldDefinitionsFor((db as TherapistDb).therapistId, PLAN_FIELD_ENTITY);
}

async function versionWithFields(db: AnyScoped, row: PlanVersionRow): Promise<PlanVersionDetail> {
  const fields = await getFieldValuesFrom(
    { therapistId: (db as TherapistDb).therapistId, patientId: row.patientId },
    PLAN_FIELD_ENTITY,
    row.id,
  );
  return { ...row, fields };
}

/** The active plan for a patient + its current version. `null` if none yet. */
export async function getPlan(db: AnyScoped, patientId: string): Promise<PlanView | null> {
  const plan = await (db as TherapistDb).findOne(
    treatmentPlan,
    eq(treatmentPlan.patientId, patientId),
  );
  if (!plan) return null;

  const versions = await (db as TherapistDb).findMany(
    treatmentPlanVersion,
    eq(treatmentPlanVersion.planId, plan.id),
  );
  const currentRow =
    versions.find((v) => v.id === plan.currentVersionId) ??
    [...versions].sort((a, b) => b.versionNo - a.versionNo)[0] ??
    null;

  return {
    plan,
    current: currentRow ? await versionWithFields(db, currentRow) : null,
    versionCount: versions.length,
  };
}

/** All versions of a patient's plan, newest first — the history view. */
export async function listPlanVersions(
  db: AnyScoped,
  patientId: string,
): Promise<PlanVersionRow[]> {
  const plan = await (db as TherapistDb).findOne(
    treatmentPlan,
    eq(treatmentPlan.patientId, patientId),
  );
  if (!plan) return [];
  return (db as TherapistDb).list(treatmentPlanVersion, {
    where: eq(treatmentPlanVersion.planId, plan.id),
    orderBy: [desc(treatmentPlanVersion.versionNo)],
    limit: 200,
  });
}

export async function getPlanVersion(
  db: AnyScoped,
  versionId: string,
): Promise<PlanVersionDetail | null> {
  const row = await (db as TherapistDb).findOne(
    treatmentPlanVersion,
    eq(treatmentPlanVersion.id, versionId),
  );
  return row ? versionWithFields(db, row) : null;
}

export type SavePlanInput = {
  patientId: string;
  note?: string | null;
  fields: FieldWriteInput[];
  createdBy?: string | null;
};

/**
 * Record a plan change. First call creates the plan; every call appends a new
 * immutable version (versionNo + 1), writes its field values against the NEW
 * version id (so earlier versions are never overwritten), repoints
 * `current_version_id`, and drops a `plan_changed` timeline event.
 */
export async function savePlanVersion(
  tdb: TherapistDb,
  input: SavePlanInput,
): Promise<{ planId: string; versionId: string; versionNo: number }> {
  const p = await tdb.findOne(patient, eq(patient.id, input.patientId));
  if (!p) throw new Error("patient_not_found");

  let plan = await tdb.findOne(treatmentPlan, eq(treatmentPlan.patientId, input.patientId));
  if (!plan) {
    [plan] = await tdb.insert(treatmentPlan, { patientId: input.patientId });
  }

  const existing = await tdb.findMany(
    treatmentPlanVersion,
    eq(treatmentPlanVersion.planId, plan.id),
  );
  const versionNo = existing.reduce((m, v) => Math.max(m, v.versionNo), 0) + 1;

  const [version] = await tdb.insert(treatmentPlanVersion, {
    planId: plan.id,
    patientId: input.patientId,
    versionNo,
    note: input.note ?? null,
    createdBy: input.createdBy ?? null,
  });

  if (input.fields.length) {
    await setFieldValuesIn(
      { therapistId: tdb.therapistId, patientId: input.patientId },
      PLAN_FIELD_ENTITY,
      version.id,
      input.fields,
    );
  }

  await tdb.update(
    treatmentPlan,
    { currentVersionId: version.id, updatedAt: new Date() },
    eq(treatmentPlan.id, plan.id),
  );

  await recordEvent(tdb, {
    patientId: input.patientId,
    type: "plan_changed",
    summary:
      versionNo === 1
        ? "תוכנית טיפול נוצרה"
        : `תוכנית טיפול עודכנה — גרסה ${versionNo}${input.note ? ` · ${input.note}` : ""}`,
    refId: version.id,
  });

  return { planId: plan.id, versionId: version.id, versionNo };
}
