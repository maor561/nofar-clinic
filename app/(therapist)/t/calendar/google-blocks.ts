import { googleBusy } from "@/modules/calendar-sync";
import { clinicDateFmt, toClinicFields } from "@/lib/tz";
import type { GoogleDayBlocks } from "./appointment-form";

const dayLabelFmt = clinicDateFmt({ weekday: "long", day: "numeric", month: "short" });
const timeFmt = clinicDateFmt({ hour: "2-digit", minute: "2-digit" });
const HORIZON_DAYS = 45;

/**
 * Google Calendar busy blocks for the next ~6 weeks, grouped and pre-formatted
 * by clinic day, for the appointment form. `[]` when nothing is blocked; the
 * caller passes `undefined` instead when the calendar isn't connected.
 */
export async function buildGoogleBlocks(therapistId: string): Promise<GoogleDayBlocks[]> {
  const from = new Date();
  const to = new Date(from.getTime() + HORIZON_DAYS * 86_400_000);
  const busy = await googleBusy(therapistId, from, to);

  const byDate = new Map<string, string[]>();
  for (const b of busy) {
    const key = toClinicFields(b.start).date;
    const range = `${timeFmt.format(b.start)}–${timeFmt.format(b.end)}`;
    const arr = byDate.get(key);
    if (arr) arr.push(range);
    else byDate.set(key, [range]);
  }

  return [...byDate.entries()]
    .sort(([a], [z]) => a.localeCompare(z))
    .map(([date, ranges]) => ({
      date,
      label: dayLabelFmt.format(new Date(`${date}T12:00:00Z`)),
      ranges,
    }));
}
