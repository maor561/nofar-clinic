import type { Metadata } from "next";
import Link from "next/link";
import { PatientForm } from "../patient-form";
import { createPatientAction } from "../actions";

export const metadata: Metadata = { title: "מטופל חדש — נופר" };

export default function NewPatientPage() {
  return (
    <div className="space-y-5">
      <Link href="/t/patients" className="text-sage-deep text-sm font-semibold hover:underline">
        ← חזרה לרשימה
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">מטופל חדש</h1>
      <p className="text-ink-soft text-sm">
        אם תזינו דוא״ל — תישלח הזמנה אוטומטית להגדרת סיסמה וכניסה למרחב הטיפולי.
      </p>
      <PatientForm action={createPatientAction} submitLabel="יצירת מטופל" />
    </div>
  );
}
