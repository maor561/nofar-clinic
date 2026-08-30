import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listPatients } from "@/modules/patients";
import { toClinicFields } from "@/lib/tz";
import { AppointmentForm } from "../appointment-form";
import { createAppointmentAction } from "../actions";

export const metadata: Metadata = { title: "פגישה חדשה — נופר" };

type SP = { patient?: string; date?: string };

export default async function NewAppointmentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tdb = await getTherapistDb();
  const patients = (await listPatients(tdb, { status: "active", limit: 200 })).map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
  }));

  // server render — default date is "today"
  const today = toClinicFields(new Date()).date;

  return (
    <div className="space-y-5">
      <Link href="/t/calendar" className="text-sage-deep text-sm font-semibold hover:underline">
        ← חזרה ליומן
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">פגישה חדשה</h1>
      <AppointmentForm
        action={createAppointmentAction}
        patients={patients}
        submitLabel="קביעת פגישה"
        values={{
          patientId: sp.patient,
          date: sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today,
        }}
        lockPatient={Boolean(sp.patient)}
      />
    </div>
  );
}
