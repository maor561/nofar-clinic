import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listTreatmentTypes, listSeriesTemplates } from "@/modules/patients";
import { listTemplates } from "@/modules/questionnaires";
import { PatientForm } from "../patient-form";
import { createPatientAction } from "../actions";

export const metadata: Metadata = { title: "מטופל חדש" };

export default async function NewPatientPage() {
  const tdb = await getTherapistDb();
  const [types, series, questionnaires] = await Promise.all([
    listTreatmentTypes(tdb),
    listSeriesTemplates(tdb),
    listTemplates(tdb),
  ]);

  return (
    <div className="space-y-5">
      <Link href="/t/patients" className="text-sage-deep text-sm font-semibold hover:underline">
        ← חזרה לרשימה
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">מטופל חדש</h1>
      <p className="text-ink-soft text-sm">
        אם תזינו דוא״ל — תישלח הזמנה אוטומטית להגדרת סיסמה וכניסה למרחב הטיפולי.
      </p>
      <PatientForm
        action={createPatientAction}
        submitLabel="יצירת מטופל"
        treatmentTypes={types.map((t) => t.name)}
        seriesOptions={series.map((s) => ({
          id: s.id,
          name: s.name,
          sessionCount: s.sessionCount,
        }))}
        questionnaireOptions={questionnaires.map((q) => ({ id: q.id, name: q.name }))}
      />
    </div>
  );
}
