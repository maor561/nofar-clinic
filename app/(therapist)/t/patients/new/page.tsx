import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listTreatmentTypes } from "@/modules/patients";
import { PatientForm } from "../patient-form";
import { createPatientAction } from "../actions";

export const metadata: Metadata = { title: "מטופל חדש — נופר" };

export default async function NewPatientPage() {
  const tdb = await getTherapistDb();
  const types = await listTreatmentTypes(tdb);

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
      />
    </div>
  );
}
