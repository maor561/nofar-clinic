import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getSession, sessionFieldDefs } from "@/modules/sessions";
import { listTreatmentTypes } from "@/modules/patients";
import type { FieldSchema } from "@/modules/core/fields";
import { SessionForm, type SessionFieldDef } from "../../session-form";
import { updateSessionAction } from "../../actions";

export const metadata: Metadata = { title: "עריכת מפגש — נופר" };

export default async function EditSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const s = await getSession(tdb, id);
  if (!s) notFound();

  const [defs, typeRows] = await Promise.all([sessionFieldDefs(tdb), listTreatmentTypes(tdb)]);
  const treatmentTypes = [
    ...new Set([...typeRows.map((t) => t.name), s.treatmentType].filter(Boolean) as string[]),
  ];
  const fieldDefs: SessionFieldDef[] = defs.map((d) => ({
    definitionId: d.id,
    key: d.key,
    labelHe: d.labelHe,
    type: d.type,
    unit: d.unit,
    schema: d.schema as FieldSchema,
  }));
  const fieldValues = Object.fromEntries(s.fields.map((f) => [f.definitionId, f.value]));

  const action = updateSessionAction.bind(null, id, s.patientId);

  return (
    <div className="space-y-5">
      <Link
        href={`/t/sessions/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה למפגש
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">עריכת מפגש</h1>
      <SessionForm
        action={action}
        fieldDefs={fieldDefs}
        patientName={s.patientName}
        submitLabel="שמירה"
        treatmentTypes={treatmentTypes}
        values={{
          date: s.date,
          treatmentType: s.treatmentType,
          patientReport: s.patientReport,
          complaints: s.complaints,
          changesSinceLast: s.changesSinceLast,
          treatmentDone: s.treatmentDone,
          recommendations: s.recommendations,
          therapistNotes: s.therapistNotes,
          nextFocus: s.nextFocus,
          fields: fieldValues,
        }}
      />
    </div>
  );
}
