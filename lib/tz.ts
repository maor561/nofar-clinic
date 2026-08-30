/**
 * The clinic runs in a single timezone (Israel). The server may run in UTC, so
 * appointment times are always converted through Asia/Jerusalem explicitly
 * rather than relying on the host locale.
 */
export const CLINIC_TZ = "Asia/Jerusalem";

/** ms that CLINIC_TZ is ahead of UTC at the given instant. */
function tzOffsetMs(instant: Date): number {
  const asClinic = new Date(instant.toLocaleString("en-US", { timeZone: CLINIC_TZ }));
  const asUtc = new Date(instant.toLocaleString("en-US", { timeZone: "UTC" }));
  return asClinic.getTime() - asUtc.getTime();
}

/**
 * Turn a wall-clock `YYYY-MM-DD` + `HH:MM` (as read on a clinic wall) into the
 * absolute instant. Correct except inside the ~1h DST fold, which is acceptable
 * for v1 scheduling.
 */
export function fromClinicWallTime(date: string, time: string): Date {
  const naiveUtc = new Date(`${date}T${time}:00Z`);
  return new Date(naiveUtc.getTime() - tzOffsetMs(naiveUtc));
}

/** `YYYY-MM-DD` / `HH:MM` of an instant, as shown on a clinic wall. */
export function toClinicFields(instant: Date): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(instant);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
}

export function clinicDateFmt(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("he-IL", { timeZone: CLINIC_TZ, ...opts });
}

/** Start (00:00 clinic time) of the ISO week (Sunday) containing `ref`. */
export function clinicWeekStart(ref: Date): Date {
  const { date } = toClinicFields(ref);
  const midday = new Date(`${date}T12:00:00Z`);
  const dow = new Intl.DateTimeFormat("en-US", { timeZone: CLINIC_TZ, weekday: "short" }).format(
    midday,
  );
  const idx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(dow);
  const sundayUtc = new Date(midday.getTime() - idx * 864e5);
  const { date: sunDate } = toClinicFields(sundayUtc);
  return fromClinicWallTime(sunDate, "00:00");
}
