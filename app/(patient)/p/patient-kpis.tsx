import Link from "next/link";
import { Icon, type IconName } from "@/modules/core/design-system";
import { clinicDateFmt, toClinicFields } from "@/lib/tz";

type Series = { usedCount: number; sessionCount: number } | null;
type NextAppt = { startsAt: Date; treatmentLabel: string | null } | null;

export type SmartPrompt = { text: string; cta: string; href: string } | null;

const weekdayFmt = clinicDateFmt({ weekday: "long" });
const timeFmt = clinicDateFmt({ hour: "2-digit", minute: "2-digit" });

/** Whole clinic-days from today to `d` (0 = today, 1 = tomorrow, <0 = past). */
function daysFromToday(d: Date, now: Date): number {
  const a = Date.parse(`${toClinicFields(now).date}T00:00:00Z`);
  const b = Date.parse(`${toClinicFields(d).date}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

function Tile({
  href,
  icon,
  label,
  tone = "sage",
  children,
}: {
  href: string;
  icon: IconName;
  label: string;
  /** "blush" = needs the patient's attention (something to act on). */
  tone?: "sage" | "blush";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "blush" ? "bg-blush-soft border-blush/30" : "bg-sage-tint border-transparent";
  return (
    <Link
      href={href}
      className={`${toneClass} hover:border-sage flex flex-col rounded-2xl border p-3.5 transition-colors`}
    >
      <span className="text-ink-soft mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
        <Icon name={icon} size={15} />
        {label}
      </span>
      {children}
    </Link>
  );
}

export function PatientKpis({
  now,
  series,
  openTasks,
  tasksDueToday,
  tasksOverdue,
  nextAppt,
  foodWeek,
  foodLoggedToday,
  smart,
}: {
  now: Date;
  series: Series;
  openTasks: number;
  tasksDueToday: number;
  tasksOverdue: number;
  nextAppt: NextAppt;
  foodWeek: number;
  foodLoggedToday: boolean;
  smart: SmartPrompt;
}) {
  const seriesRemaining = series ? Math.max(0, series.sessionCount - series.usedCount) : 0;
  const seriesPct = series
    ? Math.min(100, Math.round((series.usedCount / Math.max(1, series.sessionCount)) * 100))
    : 0;

  const apptDays = nextAppt ? daysFromToday(nextAppt.startsAt, now) : null;
  const apptBig =
    apptDays === null
      ? "—"
      : apptDays <= 0
        ? "היום"
        : apptDays === 1
          ? "מחר"
          : `עוד ${apptDays} ימים`;

  const tasksSub =
    tasksOverdue > 0
      ? `${tasksOverdue} באיחור`
      : tasksDueToday > 0
        ? `${tasksDueToday} להיום`
        : openTasks > 0
          ? "אף אחת לא דחופה"
          : "הכול סגור";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile href="/p/appointments" icon="leaf" label="טיפולים בסדרה" tone="sage">
          {series ? (
            <>
              <span className="text-ink text-2xl leading-none font-bold tabular-nums">
                {series.usedCount}
                <span className="text-ink-faint text-base font-semibold">
                  {" "}
                  / {series.sessionCount}
                </span>
              </span>
              <span className="bg-sage-soft mt-2 h-1.5 overflow-hidden rounded-full">
                <span
                  className="bg-sage block h-full rounded-full"
                  style={{ width: `${seriesPct}%` }}
                />
              </span>
              <span className="text-ink-soft mt-1.5 text-xs">
                {seriesRemaining > 0 ? `נותרו ${seriesRemaining}` : "הסדרה הושלמה"}
              </span>
            </>
          ) : (
            <>
              <span className="text-ink-faint text-2xl leading-none font-bold">—</span>
              <span className="text-ink-soft mt-2 text-xs">אין סדרה פעילה</span>
            </>
          )}
        </Tile>

        <Tile
          href="/p/tasks"
          icon="task"
          label="משימות פתוחות"
          tone={tasksOverdue > 0 || tasksDueToday > 0 ? "blush" : "sage"}
        >
          <span
            className={`text-2xl leading-none font-bold tabular-nums ${tasksOverdue > 0 ? "text-danger" : "text-ink"}`}
          >
            {openTasks}
          </span>
          <span
            className={`mt-2 text-xs ${tasksOverdue > 0 ? "text-danger font-semibold" : "text-ink-soft"}`}
          >
            {tasksSub}
          </span>
        </Tile>

        <Tile href="/p/appointments" icon="calendar" label="הפגישה הבאה">
          <span className="text-ink text-xl leading-tight font-bold">{apptBig}</span>
          <span className="text-ink-soft mt-1.5 text-xs">
            {nextAppt
              ? [
                  weekdayFmt.format(nextAppt.startsAt),
                  timeFmt.format(nextAppt.startsAt),
                  nextAppt.treatmentLabel,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : "לא נקבעה פגישה"}
          </span>
        </Tile>

        <Tile href="/p/food" icon="apple" label="יומן אכילה">
          <span className="text-ink text-2xl leading-none font-bold tabular-nums">
            {foodWeek}
            <span className="text-ink-faint text-base font-semibold"> / 7</span>
          </span>
          <span className="mt-2 flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <span
                key={i}
                className={`size-2 rounded-full ${i < foodWeek ? "bg-sage" : "bg-sage-soft"}`}
              />
            ))}
          </span>
          <span className="text-ink-soft mt-1.5 text-xs">
            {foodLoggedToday ? "עודכן היום" : "לא עודכן היום"}
          </span>
        </Tile>
      </div>

      {smart && (
        <div className="bg-blush-soft border-blush/30 flex items-center gap-3 rounded-2xl border px-3.5 py-3">
          <Icon name="target" size={18} className="text-ink-soft shrink-0" />
          <span className="text-ink flex-1 text-[13px] leading-snug font-medium">{smart.text}</span>
          <Link
            href={smart.href}
            className="bg-sage-deep shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
          >
            {smart.cta}
          </Link>
        </div>
      )}
    </div>
  );
}
