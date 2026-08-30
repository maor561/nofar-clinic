import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getAppointment, treatmentLabel } from "@/modules/appointments";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
} from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";
import { ApptStatus } from "../appt-status";
import { setStatusAction } from "../actions";

export const metadata: Metadata = { title: "פגישה — נופר" };

const whenFmt = clinicDateFmt({ dateStyle: "full", timeStyle: "short" });
const timeFmt = clinicDateFmt({ hour: "2-digit", minute: "2-digit" });

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const a = await getAppointment(tdb, id);
  if (!a) notFound();

  await audit("view", "appointment", { patientId: a.patientId, entityId: id });

  const setDone = setStatusAction.bind(null, id, "done");
  const setNoShow = setStatusAction.bind(null, id, "no_show");
  const setCancelled = setStatusAction.bind(null, id, "cancelled");
  const setScheduled = setStatusAction.bind(null, id, "scheduled");

  return (
    <div className="space-y-5">
      <Link href="/t/calendar" className="text-sage-deep text-sm font-semibold hover:underline">
        ← חזרה ליומן
      </Link>

      <header className="border-line flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-2xl font-bold">
            {a.patientName}
            <ApptStatus status={a.status} />
          </h1>
          <p className="text-ink-soft mt-1 text-sm">
            {whenFmt.format(a.startsAt)} – {timeFmt.format(a.endsAt)}
            {treatmentLabel(a.treatmentType) && <> · {treatmentLabel(a.treatmentType)}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/sessions/new?patient=${a.patientId}&appointment=${id}`}>
              <Icon name="leaf" size={16} /> תיעוד מפגש
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/patients/${a.patientId}`}>
              <Icon name="users" size={16} /> תיק המטופל/ת
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/calendar/${id}/edit`}>
              <Icon name="settings" size={16} /> עריכה
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <Card>
          <CardHeader>
            <CardTitle>הערות</CardTitle>
          </CardHeader>
          <CardContent className="text-ink-soft text-sm whitespace-pre-wrap">
            {a.notes || <span className="text-ink-faint">אין הערות</span>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>סימון סטטוס</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {a.status !== "done" && (
              <form action={setDone}>
                <Button type="submit" size="sm" className="w-full">
                  התקיימה
                </Button>
              </form>
            )}
            {a.status !== "no_show" && (
              <form action={setNoShow}>
                <Button type="submit" size="sm" variant="outline" className="w-full">
                  לא הגיע/ה
                </Button>
              </form>
            )}
            {a.status !== "cancelled" && (
              <form action={setCancelled}>
                <Button type="submit" size="sm" variant="outline" className="w-full">
                  ביטול פגישה
                </Button>
              </form>
            )}
            {a.status !== "scheduled" && (
              <form action={setScheduled}>
                <Button type="submit" size="sm" variant="ghost" className="w-full">
                  החזרה למתוכננת
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
