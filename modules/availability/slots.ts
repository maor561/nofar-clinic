/**
 * Pure open-slot engine (WP-28). No DB, no I/O — takes the therapist's weekly
 * rules, blocked dates and busy ranges, returns the bookable start instants.
 * All wall-clock reasoning goes through `lib/tz` so the host timezone is
 * irrelevant.
 */
import { CLINIC_TZ, fromClinicWallTime, toClinicFields } from "@/lib/tz";

export type WeeklyRule = { weekday: number; startMinute: number; endMinute: number };
export type BusyRange = { start: Date; end: Date };

export type SlotPolicy = {
  slotMinutes: number;
  granularityMinutes: number;
  leadHours: number;
  horizonDays: number;
  bufferMinutes: number;
};

const MS_MIN = 60_000;
const MS_DAY = 86_400_000;

const weekdayFmt = new Intl.DateTimeFormat("en-US", { timeZone: CLINIC_TZ, weekday: "short" });
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** 0 (Sun) … 6 (Sat) for a 'YYYY-MM-DD' clinic date. */
function weekdayOf(dateStr: string): number {
  return WD.indexOf(weekdayFmt.format(fromClinicWallTime(dateStr, "12:00")));
}

/** The next clinic date after `dateStr`, DST-safe (anchored at noon). */
function nextDate(dateStr: string): string {
  return toClinicFields(new Date(fromClinicWallTime(dateStr, "12:00").getTime() + MS_DAY)).date;
}

function hhmm(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Bookable start instants in `[from, to)`, ascending. A start is kept when:
 * - it falls on a weekday with a rule, at a granularity step from the window start;
 * - the whole appointment (+ buffer each side) fits inside the rule window;
 * - its date is not blocked;
 * - it is ≥ now + leadHours and ≤ now + horizonDays;
 * - the appointment (+ buffer) does not overlap any busy range.
 */
export function computeOpenSlots(args: {
  rules: WeeklyRule[];
  blockedDates: Iterable<string>;
  busy: BusyRange[];
  policy: SlotPolicy;
  from: Date;
  to: Date;
  now: Date;
}): Date[] {
  const { rules, busy, policy, from, to, now } = args;
  const blocked = new Set(args.blockedDates);
  const { slotMinutes, granularityMinutes, bufferMinutes } = policy;

  if (slotMinutes <= 0 || granularityMinutes <= 0 || rules.length === 0) return [];
  if (!(from < to)) return [];

  const earliest = now.getTime() + policy.leadHours * 3_600_000;
  const latest = now.getTime() + policy.horizonDays * MS_DAY;
  const windowLo = Math.max(from.getTime(), earliest);
  const windowHi = Math.min(to.getTime(), latest);
  if (windowLo >= windowHi) return [];

  const rulesByDay = new Map<number, WeeklyRule[]>();
  for (const r of rules) {
    if (r.startMinute >= r.endMinute) continue;
    const day = rulesByDay.get(r.weekday);
    if (day) day.push(r);
    else rulesByDay.set(r.weekday, [r]);
  }

  const busyRanges = busy
    .map((b) => ({ start: b.start.getTime(), end: b.end.getTime() }))
    .filter((b) => b.end > b.start);

  const out: Date[] = [];
  const lastDate = toClinicFields(new Date(windowHi)).date;

  for (
    let date = toClinicFields(new Date(windowLo)).date;
    date <= lastDate;
    date = nextDate(date)
  ) {
    if (blocked.has(date)) continue;
    const dayRules = rulesByDay.get(weekdayOf(date));
    if (!dayRules) continue;

    for (const rule of dayRules) {
      const lastStartMinute = rule.endMinute - bufferMinutes - slotMinutes;
      for (
        let minute = rule.startMinute + bufferMinutes;
        minute <= lastStartMinute;
        minute += granularityMinutes
      ) {
        const start = fromClinicWallTime(date, hhmm(minute)).getTime();
        const end = start + slotMinutes * MS_MIN;
        if (start < windowLo || start > windowHi) continue;

        const guardLo = start - bufferMinutes * MS_MIN;
        const guardHi = end + bufferMinutes * MS_MIN;
        const clash = busyRanges.some((b) => b.start < guardHi && b.end > guardLo);
        if (clash) continue;

        out.push(new Date(start));
      }
    }
  }

  out.sort((a, b) => a.getTime() - b.getTime());
  return out;
}
