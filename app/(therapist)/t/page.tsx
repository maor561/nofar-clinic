import Link from "next/link";
import { requireTherapist, getDisplayName } from "@/modules/core/auth/server";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listPatients } from "@/modules/patients";
import { listAppointments, treatmentLabel } from "@/modules/appointments";
import { listTasks } from "@/modules/tasks";
import { myUnreadCount } from "@/modules/core/notifications/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  cn,
  type IconName,
} from "@/modules/core/design-system";
import { clinicDateFmt, toClinicFields } from "@/lib/tz";
import { StatusPill } from "./patients/status-pill";

const timeFmt = clinicDateFmt({ hour: "2-digit", minute: "2-digit" });
const dayFmt = clinicDateFmt({ weekday: "short", day: "numeric", month: "short" });

export default async function TherapistDashboard() {
  const session = await requireTherapist();
  const name = await getDisplayName(session);
  const tdb = await getTherapistDb();

  // per-request "now" — server render
  const now = new Date();
  const todayKey = toClinicFields(now).date;

  const [patients, upcoming, past, openTasks, notifUnread] = await Promise.all([
    listPatients(tdb, { limit: 200 }),
    listAppointments(tdb, { from: now, ascending: true, limit: 60 }),
    listAppointments(tdb, { to: now, ascending: false, limit: 60 }),
    listTasks(tdb, { status: "open", limit: 6 }),
    myUnreadCount(),
  ]);

  const active = patients.filter((p) => p.status === "active");
  const today = upcoming.filter((a) => toClinicFields(a.startsAt).date === todayKey);
  const nextByPatient = new Map<string, (typeof upcoming)[number]>();
  for (const a of upcoming) if (!nextByPatient.has(a.patientId)) nextByPatient.set(a.patientId, a);
  const lastByPatient = new Map<string, (typeof past)[number]>();
  for (const a of past) if (!lastByPatient.has(a.patientId)) lastByPatient.set(a.patientId, a);

  const recent = [...patients]
    .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          בוקר טוב, {name.split(" ")[0]}
        </h1>
        <p className="text-ink-soft text-sm">{dayFmt.format(now)}</p>
      </header>

      {/* WP-16 messaging tile removed while the feature is hidden — see lib/features.ts */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat href="/t/patients" label="מטופלים פעילים" value={active.length} icon="users" />
        <Stat href="/t/calendar" label="פגישות היום" value={today.length} icon="calendar" />
        <Stat
          href="/t/alerts"
          label="התראות"
          value={notifUnread}
          icon="bell"
          highlight={notifUnread > 0}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>לוח היום</CardTitle>
            <Link href="/t/calendar" className="text-sage-deep text-[13px] hover:underline">
              ליומן ←
            </Link>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <p className="text-ink-faint text-sm">אין פגישות היום.</p>
            ) : (
              <ul className="divide-line-soft divide-y">
                {today.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <span className="text-ink w-14 shrink-0 text-sm font-semibold tabular-nums">
                      {timeFmt.format(a.startsAt)}
                    </span>
                    <Link
                      href={`/t/calendar/${a.id}`}
                      className="min-w-0 flex-1 truncate text-sm font-medium hover:underline"
                    >
                      {a.patientName}
                    </Link>
                    {treatmentLabel(a.treatmentType) && (
                      <span className="text-ink-faint text-[11px]">
                        {treatmentLabel(a.treatmentType)}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {upcoming.filter((a) => toClinicFields(a.startsAt).date !== todayKey).length > 0 && (
              <>
                <p className="text-ink-faint mt-3 mb-1.5 text-[11px] font-bold tracking-wide">
                  קרוב
                </p>
                <ul className="space-y-1">
                  {upcoming
                    .filter((a) => toClinicFields(a.startsAt).date !== todayKey)
                    .slice(0, 4)
                    .map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-[13px]">
                        <span className="text-ink-faint w-24 shrink-0 tabular-nums">
                          {dayFmt.format(a.startsAt)} {timeFmt.format(a.startsAt)}
                        </span>
                        <Link href={`/t/calendar/${a.id}`} className="truncate hover:underline">
                          {a.patientName}
                        </Link>
                      </li>
                    ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>משימות פתוחות</CardTitle>
            <span className="text-ink-faint text-xs tabular-nums">{openTasks.length}</span>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <p className="text-ink-faint text-sm">אין משימות פתוחות.</p>
            ) : (
              <ul className="space-y-2">
                {openTasks.map((t) => (
                  <li key={t.id} className="text-sm">
                    <Link
                      href={`/t/patients/${t.patientId}/tasks`}
                      className="font-medium hover:underline"
                    >
                      {t.title}
                    </Link>
                    <span className="text-ink-faint"> · {t.patientName}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>מטופלים אחרונים</CardTitle>
          <Link href="/t/patients" className="text-sage-deep text-[13px] hover:underline">
            לכל המטופלים ←
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-ink-faint border-line-soft border-b text-[11px]">
                <tr className="[&>th]:px-3.5 [&>th]:py-2 [&>th]:text-start [&>th]:font-bold">
                  <th>שם</th>
                  <th>סטטוס</th>
                  <th>פגישה אחרונה</th>
                  <th>פגישה הבאה</th>
                </tr>
              </thead>
              <tbody className="divide-line-soft divide-y">
                {recent.map((p) => {
                  const last = lastByPatient.get(p.id);
                  const next = nextByPatient.get(p.id);
                  return (
                    <tr key={p.id} className="[&>td]:px-3.5 [&>td]:py-2.5">
                      <td className="font-medium whitespace-nowrap">
                        <Link href={`/t/patients/${p.id}`} className="hover:underline">
                          {p.firstName} {p.lastName}
                        </Link>
                      </td>
                      <td>
                        <StatusPill status={p.status} />
                      </td>
                      <td className="text-ink-soft whitespace-nowrap tabular-nums">
                        {last ? dayFmt.format(last.startsAt) : "—"}
                      </td>
                      <td className="text-ink-soft whitespace-nowrap tabular-nums">
                        {next ? dayFmt.format(next.startsAt) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  href,
  label,
  value,
  icon,
  highlight = false,
}: {
  href: string;
  label: string;
  value: number;
  icon: IconName;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "border-line bg-surface hover:border-sage flex items-center gap-3 rounded-xl border p-3.5 transition-colors",
        highlight && "border-sage bg-sage-soft/40",
      )}
    >
      <span className="bg-sage-soft text-sage-deep grid size-9 shrink-0 place-items-center rounded-lg">
        <Icon name={icon} size={17} />
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-bold tabular-nums">{value}</span>
        <span className="text-ink-soft block truncate text-[12px]">{label}</span>
      </span>
    </Link>
  );
}
