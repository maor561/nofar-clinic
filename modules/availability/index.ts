import { asc, eq, gte } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { TherapistDb } from "@/modules/core/authz";
import { toClinicFields } from "@/lib/tz";
import { availabilityRule, availabilityException, bookingPolicy } from "./schema";

export { computeOpenSlots } from "./slots";
export type { WeeklyRule, BusyRange, SlotPolicy } from "./slots";

export type AvailabilityRuleRow = InferSelectModel<typeof availabilityRule>;
export type AvailabilityExceptionRow = InferSelectModel<typeof availabilityException>;
export type BookingPolicyRow = InferSelectModel<typeof bookingPolicy>;

export type BookingPolicyFields = Omit<BookingPolicyRow, "therapistId" | "updatedAt">;

/** Applied until the therapist saves her own policy. Self-scheduling stays off. */
export const DEFAULT_POLICY: BookingPolicyFields = {
  selfSchedulingEnabled: false,
  slotMinutes: 60,
  granularityMinutes: 30,
  leadHours: 12,
  horizonDays: 45,
  bufferMinutes: 0,
};

export const WEEKDAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"] as const;

export type AvailabilitySettings = {
  policy: BookingPolicyFields;
  policyPersisted: boolean;
  rules: AvailabilityRuleRow[];
  exceptions: AvailabilityExceptionRow[];
};

export type SaveAvailabilityInput = {
  policy: BookingPolicyFields;
  rules: { weekday: number; startMinute: number; endMinute: number }[];
};

const MIN_IN_DAY = 1440;

function clampInt(n: unknown, lo: number, hi: number): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v) || v < lo || v > hi) throw new Error("invalid_availability");
  return v;
}

function normalizePolicy(p: BookingPolicyFields): BookingPolicyFields {
  return {
    selfSchedulingEnabled: !!p.selfSchedulingEnabled,
    slotMinutes: clampInt(p.slotMinutes, 15, 240),
    granularityMinutes: clampInt(p.granularityMinutes, 5, 120),
    leadHours: clampInt(p.leadHours, 0, 168),
    horizonDays: clampInt(p.horizonDays, 1, 180),
    bufferMinutes: clampInt(p.bufferMinutes, 0, 60),
  };
}

function normalizeRules(
  rules: SaveAvailabilityInput["rules"],
): { weekday: number; startMinute: number; endMinute: number }[] {
  const seen = new Set<number>();
  const out: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (const r of rules) {
    const weekday = clampInt(r.weekday, 0, 6);
    if (seen.has(weekday)) throw new Error("invalid_availability");
    seen.add(weekday);
    const startMinute = clampInt(r.startMinute, 0, MIN_IN_DAY - 1);
    const endMinute = clampInt(r.endMinute, 1, MIN_IN_DAY);
    if (startMinute >= endMinute) throw new Error("invalid_availability");
    out.push({ weekday, startMinute, endMinute });
  }
  return out;
}

/** Read the therapist's availability config. Missing policy → in-memory default. */
export async function getAvailabilitySettings(tdb: TherapistDb): Promise<AvailabilitySettings> {
  const today = toClinicFields(new Date()).date;
  const [policyRow, rules, exceptions] = await Promise.all([
    tdb.findOne(bookingPolicy),
    tdb.list(availabilityRule, { orderBy: [asc(availabilityRule.weekday)] }),
    tdb.list(availabilityException, {
      where: gte(availabilityException.date, today),
      orderBy: [asc(availabilityException.date)],
    }),
  ]);

  const policy: BookingPolicyFields = policyRow
    ? {
        selfSchedulingEnabled: policyRow.selfSchedulingEnabled,
        slotMinutes: policyRow.slotMinutes,
        granularityMinutes: policyRow.granularityMinutes,
        leadHours: policyRow.leadHours,
        horizonDays: policyRow.horizonDays,
        bufferMinutes: policyRow.bufferMinutes,
      }
    : { ...DEFAULT_POLICY };

  return { policy, policyPersisted: !!policyRow, rules, exceptions };
}

/** Replace the weekly rules and upsert the policy in one call. */
export async function saveAvailability(
  tdb: TherapistDb,
  input: SaveAvailabilityInput,
): Promise<void> {
  const policy = normalizePolicy(input.policy);
  const rules = normalizeRules(input.rules);

  const existing = await tdb.findOne(bookingPolicy);
  if (existing) {
    await tdb.update(bookingPolicy, { ...policy, updatedAt: new Date() });
  } else {
    await tdb.insert(bookingPolicy, policy);
  }

  await tdb.delete(availabilityRule);
  if (rules.length > 0) await tdb.insert(availabilityRule, rules);
}

export async function addBlockedDate(
  tdb: TherapistDb,
  date: string,
  note: string | null,
): Promise<void> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("invalid_availability");
  await tdb.insert(availabilityException, { date, note: note?.trim() || null });
}

export async function removeBlockedDate(tdb: TherapistDb, id: string): Promise<void> {
  await tdb.delete(availabilityException, eq(availabilityException.id, id));
}
