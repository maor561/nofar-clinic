import { and, desc, eq, gte, lte, type InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { recordEvent } from "@/modules/patient-file";
import { foodLogDay, MEALS, type Meal } from "./schema";

export { MEALS, MEAL_LABEL, type Meal } from "./schema";

type AnyScoped = TherapistDb | PatientDb;

export type FoodDayRow = InferSelectModel<typeof foodLogDay>;
export type MealInput = Partial<Record<Meal, string | null>>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function clean(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t.length ? t : null;
}
function isBlank(row: FoodDayRow): boolean {
  return (
    !row.wakeup &&
    !row.breakfast &&
    !row.lunch &&
    !row.afternoon &&
    !row.evening &&
    !row.patientNote
  );
}

/** One day (or null if never touched). */
export async function getFoodDay(
  db: AnyScoped,
  patientId: string,
  date: string,
): Promise<FoodDayRow | null> {
  if (!DATE_RE.test(date)) throw new Error("invalid_date");
  return (db as TherapistDb).findOne(
    foodLogDay,
    and(eq(foodLogDay.patientId, patientId), eq(foodLogDay.date, date))!,
  );
}

/** Days in a window, newest first — for history + the therapist review list. */
export async function listFoodDays(
  db: AnyScoped,
  patientId: string,
  opts: { from?: string; to?: string; limit?: number } = {},
): Promise<FoodDayRow[]> {
  const conds = [eq(foodLogDay.patientId, patientId)];
  if (opts.from) conds.push(gte(foodLogDay.date, opts.from));
  if (opts.to) conds.push(lte(foodLogDay.date, opts.to));
  return (db as TherapistDb).list(foodLogDay, {
    where: and(...conds),
    orderBy: [desc(foodLogDay.date)],
    limit: Math.min(opts.limit ?? 120, 400),
  });
}

/** Patient saves the meals + their own note for a day. Returns whether this is
 *  the first time the day has content (so the caller can notify the therapist). */
export async function saveFoodDay(
  pdb: PatientDb,
  date: string,
  meals: MealInput & { patientNote?: string | null },
): Promise<{ firstEntry: boolean }> {
  if (!DATE_RE.test(date)) throw new Error("invalid_date");

  const patientId = pdb.patientId;
  const existing = await getFoodDay(pdb, patientId, date);
  const wasBlank = !existing || isBlank(existing);

  const cols = {
    wakeup: meals.wakeup !== undefined ? clean(meals.wakeup) : (existing?.wakeup ?? null),
    breakfast:
      meals.breakfast !== undefined ? clean(meals.breakfast) : (existing?.breakfast ?? null),
    lunch: meals.lunch !== undefined ? clean(meals.lunch) : (existing?.lunch ?? null),
    afternoon:
      meals.afternoon !== undefined ? clean(meals.afternoon) : (existing?.afternoon ?? null),
    evening: meals.evening !== undefined ? clean(meals.evening) : (existing?.evening ?? null),
    patientNote:
      meals.patientNote !== undefined ? clean(meals.patientNote) : (existing?.patientNote ?? null),
    updatedAt: new Date(),
  };

  if (existing) {
    await pdb.update(foodLogDay, cols, eq(foodLogDay.id, existing.id));
  } else {
    await pdb.insert(foodLogDay, { patientId, date, ...cols });
  }

  const nowHasContent = !!(
    cols.wakeup ||
    cols.breakfast ||
    cols.lunch ||
    cols.afternoon ||
    cols.evening ||
    cols.patientNote
  );
  const firstEntry = wasBlank && nowHasContent;
  if (firstEntry) {
    await recordEvent(pdb, {
      patientId,
      type: "food_log",
      summary: `יומן אכילה עודכן — ${date}`,
    });
  }
  return { firstEntry };
}

/** Therapist writes/updates the feedback note for a day (shown to the patient). */
export async function setTherapistNote(
  tdb: TherapistDb,
  patientId: string,
  date: string,
  note: string | null,
): Promise<void> {
  if (!DATE_RE.test(date)) throw new Error("invalid_date");
  const existing = await getFoodDay(tdb, patientId, date);
  const value = clean(note);
  if (existing) {
    await tdb.update(
      foodLogDay,
      { therapistNote: value, therapistNoteAt: new Date(), updatedAt: new Date() },
      eq(foodLogDay.id, existing.id),
    );
  } else {
    await tdb.insert(foodLogDay, {
      patientId,
      date,
      therapistNote: value,
      therapistNoteAt: new Date(),
    });
  }
}

/** How many days in [from,to] have any patient content — for the small stat strip. */
export async function countLoggedDays(
  db: AnyScoped,
  patientId: string,
  from: string,
  to: string,
): Promise<number> {
  const rows = await listFoodDays(db, patientId, { from, to, limit: 400 });
  return rows.filter((r) => !isBlank(r)).length;
}

export const MEAL_KEYS = MEALS;
