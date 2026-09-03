import type { Metadata } from "next";
import Link from "next/link";
import { getPatientDb, getSchedulingView } from "@/modules/core/authz/server";
import { listAppointmentRows, APPT_STATUS_LABEL, treatmentLabel } from "@/modules/appointments";
import { Button, Card, EmptyState, cn } from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";
import { seriesBookableLeft } from "./new/series-cap";

export const metadata: Metadata = { title: "הפגישות שלי" };

const whenFmt = clinicDateFmt({ dateStyle: "full", timeStyle: "short" });
const timeFmt = clinicDateFmt({ hour: "2-digit", minute: "2-digit" });

export default async function MyAppointmentsPage() {
  const pdb = await getPatientDb();
  const [rows, view, bookableLeft] = await Promise.all([
    listAppointmentRows(pdb, { ascending: true, limit: 500 }),
    getSchedulingView(),
    seriesBookableLeft(pdb, pdb.patientId),
  ]);
  const selfScheduling = !!(await view?.config())?.policy?.selfSchedulingEnabled;
  const canBook = selfScheduling && (bookableLeft === null || bookableLeft > 0);

  // server render — "now" splits upcoming from past
  /* eslint-disable-next-line react-hooks/purity */
  const now = Date.now();
  const upcoming = rows.filter((a) => a.endsAt.getTime() >= now && a.status !== "cancelled");
  const past = rows.filter((a) => a.endsAt.getTime() < now || a.status === "cancelled").reverse();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">הפגישות שלי</h1>
          <p className="text-ink-soft text-sm">הפגישות הקרובות והקודמות שלך אצל נופר.</p>
          {bookableLeft !== null && (
            <p className="text-ink-faint mt-0.5 text-[13px]">
              {bookableLeft > 0
                ? `אפשר לקבוע עוד ${bookableLeft} מפגשים בסדרה.`
                : "כל המפגשים בסדרה נקבעו — לתיאום המשך פני/ה לנופר."}
            </p>
          )}
        </div>
        {canBook && (
          <Button asChild size="sm">
            <Link href="/p/appointments/new">קביעת תור חדש</Link>
          </Button>
        )}
      </header>

      <section className="space-y-2">
        <h2 className="text-ink-faint text-xs font-bold tracking-wide">קרובות</h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="אין פגישות קרובות"
            description="כשתיקבע פגישה, היא תופיע כאן."
          />
        ) : (
          <Card className="divide-line-soft divide-y p-0">
            {upcoming.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-3.5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{whenFmt.format(a.startsAt)}</span>
                  <span className="text-ink-faint text-[13px]">
                    עד {timeFmt.format(a.endsAt)}
                    {treatmentLabel(a.treatmentType) && <> · {treatmentLabel(a.treatmentType)}</>}
                  </span>
                </span>
              </div>
            ))}
          </Card>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-ink-faint text-xs font-bold tracking-wide">קודמות</h2>
          <Card className="divide-line-soft divide-y p-0">
            {past.map((a) => (
              <div key={a.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="text-ink-soft min-w-0 flex-1 truncate text-[13px]">
                  {whenFmt.format(a.startsAt)}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
                    a.status === "cancelled"
                      ? "text-ink-faint bg-[#f0eee9]"
                      : a.status === "no_show"
                        ? "bg-amber-soft text-amber-ink"
                        : "bg-line-soft text-ink-soft",
                  )}
                >
                  {APPT_STATUS_LABEL[a.status]}
                </span>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}
