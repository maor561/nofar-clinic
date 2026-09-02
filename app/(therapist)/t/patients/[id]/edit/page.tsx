import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatient, listTreatmentTypes } from "@/modules/patients";
import { listTemplates, listPatientQuestionnaires } from "@/modules/questionnaires";
import { PatientForm } from "../../patient-form";
import { updatePatientAction } from "../../actions";
import { DeletePatientCard } from "./delete-patient";

export const metadata: Metadata = { title: "עריכת מטופל" };

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const [p, typeRows, questionnaires, assigned] = await Promise.all([
    getPatient(tdb, id),
    listTreatmentTypes(tdb),
    listTemplates(tdb),
    listPatientQuestionnaires(tdb, id),
  ]);
  if (!p) notFound();

  const treatmentTypes = [...new Set([...typeRows.map((t) => t.name), ...p.treatmentTypes])];
  const assignedIds = assigned.map((q) => q.templateId).filter((x): x is string => x != null);
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
        questionnaireOptions={questionnaires.map((q) => ({ id: q.id, name: q.name }))}
        assignedQuestionnaireIds={assignedIds}
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

      <DeletePatientCard id={id} fullName={`${p.firstName} ${p.lastName}`.trim()} />
    </div>
  );
}
