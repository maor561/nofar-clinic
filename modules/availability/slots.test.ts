import { describe, expect, it } from "vitest";
import { fromClinicWallTime } from "@/lib/tz";
import { computeOpenSlots, type WeeklyRule } from "./slots";

// 2026-09-01 is a Tuesday (weekday 2). Israel is on IDT (UTC+3) in September.
const TUE = "2026-09-01";
const WED = "2026-09-02";
const at = (date: string, time: string) => fromClinicWallTime(date, time);

const NINE_TO_FIVE: WeeklyRule = { weekday: 2, startMinute: 540, endMinute: 1020 };
const BASE_POLICY = {
  slotMinutes: 60,
  granularityMinutes: 60,
  leadHours: 0,
  horizonDays: 30,
  bufferMinutes: 0,
};

function run(over: Partial<Parameters<typeof computeOpenSlots>[0]> = {}) {
  return computeOpenSlots({
    rules: [NINE_TO_FIVE],
    blockedDates: [],
    busy: [],
    policy: BASE_POLICY,
    from: at(TUE, "00:00"),
    to: at(WED, "00:00"),
    now: at(TUE, "07:00"),
    ...over,
  });
}

const asHm = (dates: Date[]) =>
  dates.map((d) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Jerusalem",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d),
  );

describe("computeOpenSlots", () => {
  it("fills a weekday window at the granularity step", () => {
    // 09:00 … 16:00 (last start that leaves room for a 60m slot before 17:00)
    expect(asHm(run())).toEqual([
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
    ]);
  });

  it("returns nothing for a weekday with no rule", () => {
    expect(run({ rules: [{ weekday: 3, startMinute: 540, endMinute: 1020 }] })).toEqual([]);
  });

  it("honours two separate windows on the same weekday", () => {
    // Tuesday 10:00–12:00 and 16:00–19:00
    const slots = run({
      rules: [
        { weekday: 2, startMinute: 600, endMinute: 720 },
        { weekday: 2, startMinute: 960, endMinute: 1140 },
      ],
    });
    expect(asHm(slots)).toEqual(["10:00", "11:00", "16:00", "17:00", "18:00"]);
  });

  it("honours a finer granularity", () => {
    expect(asHm(run({ policy: { ...BASE_POLICY, granularityMinutes: 30 } }))).toHaveLength(15);
  });

  it("drops slots inside the lead-time window", () => {
    // now 08:00, lead 4h → earliest bookable 12:00
    const out = asHm(run({ now: at(TUE, "08:00"), policy: { ...BASE_POLICY, leadHours: 4 } }));
    expect(out[0]).toBe("12:00");
    expect(out).not.toContain("11:00");
  });

  it("excludes a blocked date entirely", () => {
    expect(run({ blockedDates: [TUE] })).toEqual([]);
  });

  it("removes only the slots that overlap a busy range", () => {
    const busy = [{ start: at(TUE, "10:00"), end: at(TUE, "11:30") }];
    const out = asHm(run({ busy }));
    expect(out).not.toContain("10:00");
    expect(out).not.toContain("11:00");
    expect(out).toContain("09:00");
    expect(out).toContain("12:00");
  });

  it("keeps a buffer clear before and after busy ranges", () => {
    // buffer 60 → window shrinks to 10:00…15:00; the 12:00–13:00 booking plus
    // its 60m buffers each side knocks out 11:00, 12:00 and 13:00.
    const busy = [{ start: at(TUE, "12:00"), end: at(TUE, "13:00") }];
    const out = asHm(run({ busy, policy: { ...BASE_POLICY, bufferMinutes: 60 } }));
    expect(out).toEqual(["10:00", "14:00", "15:00"]);
  });

  it("respects the booking horizon", () => {
    const out = run({
      to: at("2026-09-30", "00:00"),
      policy: { ...BASE_POLICY, horizonDays: 3 },
      now: at(TUE, "07:00"),
    });
    // only the first Tuesday is inside a 3-day horizon
    expect(asHm(out).every((t) => t >= "09:00" && t <= "16:00")).toBe(true);
    expect(out.every((d) => d.getTime() < at(TUE, "07:00").getTime() + 3 * 86_400_000)).toBe(true);
  });

  it("is empty without rules", () => {
    expect(run({ rules: [] })).toEqual([]);
  });
});
