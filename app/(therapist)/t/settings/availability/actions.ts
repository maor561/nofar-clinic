"use server";

import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import {
  saveAvailability,
  addBlockedDate,
  removeBlockedDate,
  type BookingPolicyFields,
} from "@/modules/availability";

export type AvailabilityFormState = { error?: string; ok?: number };

function toMinutes(v: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const min = Number(m[1]) * 60 + Number(m[2]);
  return min >= 0 && min <= 1440 ? min : null;
}

const DAY_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

export async function saveAvailabilityAction(
  _prev: AvailabilityFormState,
  fd: FormData,
): Promise<AvailabilityFormState> {
  const rules: { weekday: number; startMinute: number; endMinute: number }[] = [];
  for (let d = 0; d < 7; d++) {
    if (fd.get(`d${d}_enabled`) == null) continue;
    const starts = fd.getAll(`d${d}_start`).map(String);
    const ends = fd.getAll(`d${d}_end`).map(String);
    for (let w = 0; w < starts.length; w++) {
      const startMinute = toMinutes(starts[w]);
      const endMinute = toMinutes(ends[w] ?? "");
      if (startMinute == null || endMinute == null || startMinute >= endMinute) {
        return { error: `שעות לא תקינות ליום ${DAY_HE[d]}` };
      }
      rules.push({ weekday: d, startMinute, endMinute });
    }
  }

  const policy: BookingPolicyFields = {
    selfSchedulingEnabled: fd.get("selfSchedulingEnabled") != null,
    slotMinutes: Number(fd.get("slotMinutes") ?? 60),
    granularityMinutes: Number(fd.get("granularityMinutes") ?? 30),
    leadHours: Number(fd.get("leadHours") ?? 12),
    horizonDays: Number(fd.get("horizonDays") ?? 45),
    bufferMinutes: Number(fd.get("bufferMinutes") ?? 0),
  };

  if (policy.selfSchedulingEnabled && rules.length === 0) {
    return { error: "כדי לאפשר קביעה עצמית צריך להגדיר לפחות יום עבודה אחד" };
  }

  const tdb = await getTherapistDb();
  try {
    await saveAvailability(tdb, { policy, rules });
  } catch (e) {
    if (e instanceof Error && e.message === "overlapping_windows") {
      return { error: "יש חלונות שעות שחופפים באותו יום. תקנו ונסו שוב." };
    }
    return { error: "שמירת הזמינות נכשלה. בדקו את הערכים ונסו שוב." };
  }

  revalidatePath("/t/settings/availability");
  return { ok: Date.now() };
}

export async function addBlockedDateAction(
  _prev: AvailabilityFormState,
  fd: FormData,
): Promise<AvailabilityFormState> {
  const date = String(fd.get("date") ?? "");
  const note = String(fd.get("note") ?? "").trim() || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "בחרו תאריך" };

  const tdb = await getTherapistDb();
  try {
    await addBlockedDate(tdb, date, note);
  } catch {
    return { error: "התאריך כבר חסום, או שהערך לא תקין." };
  }
  revalidatePath("/t/settings/availability");
  return { ok: Date.now() };
}

export async function removeBlockedDateAction(id: string): Promise<void> {
  const tdb = await getTherapistDb();
  try {
    await removeBlockedDate(tdb, id);
  } catch {
    return;
  }
  revalidatePath("/t/settings/availability");
}
