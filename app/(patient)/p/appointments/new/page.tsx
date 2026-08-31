import type { Metadata } from "next";
import Link from "next/link";
import { getSchedulingView } from "@/modules/core/authz/server";
import { computeOpenSlots } from "@/modules/availability";
import { googleBusy } from "@/modules/calendar-sync";
import { Card, CardContent, EmptyState, Icon } from "@/modules/core/design-system";
import { clinicWeekStart, clinicDateFmt, toClinicFields } from "@/lib/tz";
import { BookGrid, type DaySlots } from "./book-grid";

export const metadata: Metadata = { title: "קביעת תור — נופר" };

const dayLabelFmt = clinicDateFmt({ weekday: "long", day: "numeric", month: "long" });
const timeFmt = clinicDateFmt({ hour: "2-digit", minute: "2-digit" });
const fullFmt = clinicDateFmt({ dateStyle: "full", timeStyle: "short" });
const rangeFmt = clinicDateFmt({ day: "numeric", month: "short" });
const DAY = 86_400_000;
const MAX_WEEKS = 26;

function Header() {
  return (
    <header className="space-y-1">
      <Link
        href="/p/appointments"
        className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
      >
        <Icon name="chevron" size={14} /> לפגישות שלי
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">קביעת תור</h1>
      <p className="text-ink-soft text-sm">
        בחרו שעה פנויה מהשבוע. הפגישה נקבעת מיד ותופיע בפגישות שלכם.
      </p>
    </header>
  );
}

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const view = await getSchedulingView();
  if (!view) return null;
  const { policy, rules, blockedDates } = await view.config();

  if (!policy?.selfSchedulingEnabled) {
    return (
      <div className="space-y-5">
        <Header />
        <EmptyState
          icon="calendar"
          title="קביעת תורים עצמית אינה פעילה"
          description="לתיאום פגישה פנו לנופר ישירות."
        />
      </div>
    );
  }

  const sp = await searchParams;
  const wRaw = Math.trunc(Number(sp.w ?? 0));
  const weekOffset = Number.isFinite(wRaw) ? Math.min(MAX_WEEKS, Math.max(0, wRaw)) : 0;

  const now = new Date();
  const weekStart = new Date(clinicWeekStart(now).getTime() + weekOffset * 7 * DAY);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY);

  const slotPolicy = {
    slotMinutes: policy.slotMinutes,
    granularityMinutes: policy.granularityMinutes,
    leadHours: policy.leadHours,
    horizonDays: policy.horizonDays,
    bufferMinutes: policy.bufferMinutes,
  };
  const [internalBusy, gBusy] = await Promise.all([
    view.busyRanges(weekStart, weekEnd),
    googleBusy(view.therapistId, weekStart, weekEnd),
  ]);
  const busy = [...internalBusy, ...gBusy];
  const slots = computeOpenSlots({
    rules,
    blockedDates,
    busy,
    policy: slotPolicy,
    from: weekStart,
    to: weekEnd,
    now,
  });

  const byDate = new Map<string, Date[]>();
  for (const s of slots) {
    const key = toClinicFields(s).date;
    const list = byDate.get(key);
    if (list) list.push(s);
    else byDate.set(key, [s]);
  }

  const days: DaySlots[] = Array.from({ length: 7 }, (_, i) => {
    const noon = new Date(weekStart.getTime() + i * DAY + 12 * 3_600_000);
    const key = toClinicFields(noon).date;
    return {
      label: dayLabelFmt.format(noon),
      slots: (byDate.get(key) ?? []).map((s) => ({
        iso: s.toISOString(),
        time: timeFmt.format(s),
        full: fullFmt.format(s),
      })),
    };
  });

  const horizonEnd = now.getTime() + slotPolicy.horizonDays * DAY;
  const canPrev = weekOffset > 0;
  const canNext = weekOffset < MAX_WEEKS && weekStart.getTime() + 7 * DAY < horizonEnd;

  return (
    <div className="space-y-5">
      <Header />

      <div className="flex items-center justify-between text-sm">
        <WeekNav dir="prev" href={`/p/appointments/new?w=${weekOffset - 1}`} disabled={!canPrev} />
        <span className="font-semibold tabular-nums">
          {rangeFmt.format(weekStart)} – {rangeFmt.format(new Date(weekEnd.getTime() - DAY))}
        </span>
        <WeekNav dir="next" href={`/p/appointments/new?w=${weekOffset + 1}`} disabled={!canNext} />
      </div>

      <Card>
        <CardContent className="pt-5">
          <BookGrid days={days} />
        </CardContent>
      </Card>
    </div>
  );
}

function WeekNav({
  dir,
  href,
  disabled,
}: {
  dir: "prev" | "next";
  href: string;
  disabled: boolean;
}) {
  const label = dir === "prev" ? "שבוע קודם" : "שבוע הבא";
  if (disabled) {
    return <span className="text-ink-faint/50 px-2 py-1 text-[13px]">{label}</span>;
  }
  return (
    <Link
      href={href}
      className="text-sage-deep px-2 py-1 text-[13px] font-semibold hover:underline"
    >
      {label}
    </Link>
  );
}
