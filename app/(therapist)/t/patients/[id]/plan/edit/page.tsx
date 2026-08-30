import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatient } from "@/modules/patients";
import { getPlan, planFieldDefs } from "@/modules/plans";
import type { FieldSchema } from "@/modules/core/fields";
import { PlanForm, type PlanFieldDef } from "../plan-form";
import { savePlanAction } from "../actions";

export const metadata: Metadata = { title: "עדכון תוכנית — נופר" };

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const [defsRaw, view] = await Promise.all([planFieldDefs(tdb), getPlan(tdb, id)]);
  const fieldDefs: PlanFieldDef[] = defsRaw.map((d) => ({
    definitionId: d.id,
    key: d.key,
    labelHe: d.labelHe,
    type: d.type,
    unit: d.unit,
    schema: d.schema as FieldSchema,
  }));

  // seed the form from the current version so an edit carries prior content forward
  const values = Object.fromEntries(
    (view?.current?.fields ?? []).map((f) => [f.definitionId, f.value]),
  );

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}/plan`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתוכנית
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        {view ? "עדכון תוכנית" : "יצירת תוכנית"} · {p.firstName} {p.lastName}
      </h1>
      <PlanForm
        action={savePlanAction.bind(null, id)}
        fieldDefs={fieldDefs}
        values={values}
        currentVersionNo={view?.current?.versionNo ?? null}
        submitLabel={view ? "שמירת גרסה חדשה" : "יצירת התוכנית"}
      />
    </div>
  );
}
