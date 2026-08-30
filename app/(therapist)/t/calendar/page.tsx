import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import {
  listAppointments,
  appointmentStatus,
  APPT_STATUS_LABEL,
  treatmentLabel,
  type AppointmentStatus,
} from "@/modules/appointments";
import { Button, Card, EmptyState, Icon, cn } from "@/modules/core/design-system";
import { clinicDateFmt, clinicWeekStart, toClinicFields } from "@/lib/tz";
import { ApptStatus } from "./appt-status";

export const metadata: Metadata = { title: "יומן — נופר" };

type SP = { w?: string; s?: string };

const dayHead = clinicDateFmt({ weekday: "long", day: "numeric", month: "long" });
const timeFmt = clinicDateFmt({ hour: "2-digit", minute: "2-digit" });
const weekLabelFmt = clinicDateFmt({ day: "numeric", month: "short" });

export default async function CalendarPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  // server render — "this week" is per-request
  const anchor =
    sp.w && /^\d{4}-\d{2}-\d{2}$/.test(sp.w) ? new Date(`${sp.w}T12:00:00Z`) : new Date();
  const weekStart = clinicWeekStart(anchor);
  const weekEnd = new Date(weekStart.getTime() + 7 * 864e5);
  const status = (appointmentStatus as readonly string[]).includes(sp.s ?? "")
    ? (sp.s as AppointmentStatus)
    : undefined;

  const tdb = await getTherapistDb();
  const appts = await listAppointments(tdb, {
    from: weekStart,
    to: weekEnd,
    status,
    ascending: true,
    limit: 500,
  });

  const byDay = new Map<string, typeof appts>();
  for (const a of appts) {
    const key = toClinicFields(a.startsAt).date;
    const bucket = byDay.get(key);
    if (bucket) bucket.push(a);
    else byDay.set(key, [a]);
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 864e5);
    return { date: toClinicFields(d).date, dt: d };
  });

  const shift = (deltaDays: number) => {
    const d = new Date(weekStart.getTime() + deltaDays * 864e5);
    return `/t/calendar?w=${toClinicFields(d).date}${status ? `&s=${status}` : ""}`;
  };
  const withStatus = (s?: AppointmentStatus) => {
    const wq = `w=${toClinicFields(weekStart).date}`;
    return s ? `/t/calendar?${wq}&s=${s}` : `/t/calendar?${wq}`;
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">יומן</h1>
          <p className="text-ink-soft text-sm">
            {weekLabelFmt.format(weekStart)} –{" "}
            {weekLabelFmt.format(new Date(weekEnd.getTime() - 864e5))} · {appts.length} פגישות
          </p>
        </div>
        <Button asChild>
          <Link href="/t/calendar/new">
            <Icon name="plus" size={16} /> פגישה חדשה
          </Link>
        </Button>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={shift(-7)} aria-label="שבוע קודם">
            <Icon name="chevron" size={16} className="rotate-180" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/t/calendar">היום</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={shift(7)} aria-label="שבוע הבא">
            <Icon name="chevron" size={16} />
          </Link>
        </Button>
        <span className="bg-line mx-1 h-5 w-px" />
        <FilterChip href={withStatus()} active={!status}>
          הכול
        </FilterChip>
        {appointmentStatus.map((s) => (
          <FilterChip key={s} href={withStatus(s)} active={status === s}>
            {APPT_STATUS_LABEL[s]}
          </FilterChip>
        ))}
      </div>

      {appts.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="אין פגישות בשבוע הזה"
          description="הוסיפו פגישה חדשה, או דלגו לשבוע אחר."
          action={
            <Button asChild size="sm">
              <Link href="/t/calendar/new">פגישה חדשה</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {days.map((d) => {
            const items = byDay.get(d.date) ?? [];
            return (
              <section key={d.date}>
                <h2 className="text-ink-faint mb-1.5 text-[11px] font-bold tracking-wide">
                  {dayHead.format(d.dt)}
                </h2>
                {items.length === 0 ? (
                  <p className="text-ink-faint border-line-soft rounded-lg border border-dashed px-3 py-2 text-[13px]">
                    —
                  </p>
                ) : (
                  <Card className="divide-line-soft divide-y p-0">
                    {items.map((a) => (
                      <Link
                        key={a.id}
                        href={`/t/calendar/${a.id}`}
                        className="hover:bg-surface-2 flex items-center gap-3 px-3.5 py-2.5 transition-colors"
                      >
                        <span className="text-ink w-24 shrink-0 text-sm font-semibold tabular-nums">
                          {timeFmt.format(a.startsAt)}–{timeFmt.format(a.endsAt)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {a.patientName}
                        </span>
                        {treatmentLabel(a.treatmentType) && (
                          <span className="bg-sage-soft text-sage-deep hidden rounded-md px-2 py-0.5 text-[11px] font-semibold sm:inline">
                            {treatmentLabel(a.treatmentType)}
                          </span>
                        )}
                        <ApptStatus status={a.status} />
                      </Link>
                    ))}
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors",
        active
          ? "border-sage bg-sage-soft text-sage-deep"
          : "border-line text-ink-soft hover:border-sage",
      )}
    >
      {children}
    </Link>
  );
}
