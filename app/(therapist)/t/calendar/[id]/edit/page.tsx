import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getAppointment } from "@/modules/appointments";
import { toClinicFields } from "@/lib/tz";
import { AppointmentForm } from "../../appointment-form";
import { updateAppointmentAction } from "../../actions";

export const metadata: Metadata = { title: "עריכת פגישה — נופר" };

export default async function EditAppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const a = await getAppointment(tdb, id);
  if (!a) notFound();

  const { date, time } = toClinicFields(a.startsAt);
  const durationMin = Math.round((a.endsAt.getTime() - a.startsAt.getTime()) / 60_000);
  const action = updateAppointmentAction.bind(null, id);

  return (
    <div className="space-y-5">
      <Link
        href={`/t/calendar/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לפגישה
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        עריכת פגישה — {a.patientName}
      </h1>
      <AppointmentForm
        action={action}
        patients={[{ id: a.patientId, name: a.patientName }]}
        submitLabel="שמירה"
        lockPatient
        values={{
          patientId: a.patientId,
          date,
          time,
          durationMin,
          treatmentType: a.treatmentType,
          notes: a.notes,
        }}
      />
    </div>
  );
}
