import type { TherapistDb } from "@/modules/core/authz";
import { listAppointments } from "@/modules/appointments";
import { googleBusy } from "@/modules/calendar-sync";
import { clinicDateFmt, toClinicFields } from "@/lib/tz";
import type { DayBlocks } from "./appointment-form";

const dayLabelFmt = clinicDateFmt({ weekday: "long", day: "numeric", month: "short" });
const HORIZON_DAYS = 45;

/** Minutes from clinic midnight for an instant. */
function clinicMinutes(d: Date): number {
  const [h, m] = toClinicFields(d).time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * What's already on the therapist's day for the next ~6 weeks — Google busy
 * windows + existing (non-cancelled) internal appointments — grouped by clinic
 * day, as minute offsets ready for the day-timeline. Pass `excludeId` when
 * editing so an appointment isn't shown as a conflict with itself.
 */
export async function buildDayBlocks(tdb: TherapistDb, excludeId?: string): Promise<DayBlocks[]> {
  const from = new Date();
  const to = new Date(from.getTime() + HORIZON_DAYS * 86_400_000);

  const [busy, appts] = await Promise.all([
    googleBusy(tdb.therapistId, from, to),
    listAppointments(tdb, { from, to, ascending: true, limit: 500 }),
  ]);

  const byDate = new Map<string, DayBlocks["items"]>();
  const add = (start: Date, end: Date, kind: "google" | "appt", label: string) => {
    const key = toClinicFields(start).date;
    let startMin = clinicMinutes(start);
    let endMin = clinicMinutes(end);
    if (endMin <= startMin) endMin = 1440; // spills past midnight — clamp to end of day
    startMin = Math.max(0, startMin);
    const item = { startMin, endMin, kind, label };
    const arr = byDate.get(key);
    if (arr) arr.push(item);
    else byDate.set(key, [item]);
  };

  for (const b of busy) add(b.start, b.end, "google", "תפוס ביומן Google");
  for (const a of appts) {
    if (a.status === "cancelled" || a.id === excludeId) continue;
    add(a.startsAt, a.endsAt, "appt", a.patientName);
  }

  return [...byDate.entries()]
    .sort(([a], [z]) => a.localeCompare(z))
    .map(([date, items]) => ({
      date,
      label: dayLabelFmt.format(new Date(`${date}T12:00:00Z`)),
      items: items.sort((x, y) => x.startMin - y.startMin),
    }));
}
