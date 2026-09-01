import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatient, listTreatmentTypes } from "@/modules/patients";
import { PatientForm } from "../../patient-form";
import { updatePatientAction } from "../../actions";

export const metadata: Metadata = { title: "עריכת מטופל — נופר" };

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const [p, typeRows] = await Promise.all([getPatient(tdb, id), listTreatmentTypes(tdb)]);
  if (!p) notFound();

  const treatmentTypes = [...new Set([...typeRows.map((t) => t.name), ...p.treatmentTypes])];
  const action = updatePatientAction.bind(null, id);

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        עריכת {p.firstName} {p.lastName}
      </h1>
      <PatientForm
        action={action}
        submitLabel="שמירה"
        showStatus
        treatmentTypes={treatmentTypes}
        values={{
          firstName: p.firstName,
          lastName: p.lastName,
          dob: p.dob,
          phone: p.phone,
          email: p.email,
          address: p.address,
          treatmentGoal: p.treatmentGoal,
          generalNotes: p.generalNotes,
          status: p.status,
          treatmentTypes: p.treatmentTypes,
          consents: p.consents,
        }}
      />
    </div>
  );
}
