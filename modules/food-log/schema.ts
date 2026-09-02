import { pgTable, uuid, text, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

/**
 * Shared food diary (WP-69). One row per patient per day. Five fixed meal
 * slots + the patient's note + the therapist's feedback note (shown to the
 * patient). Dual-scoped so both handles reach only their own rows.
 */

export const MEALS = ["wakeup", "breakfast", "lunch", "afternoon", "evening"] as const;
export type Meal = (typeof MEALS)[number];

export const MEAL_LABEL: Record<Meal, string> = {
  wakeup: "ארוחת קימה",
  breakfast: "ארוחת בוקר",
  lunch: "ארוחת צהריים",
  afternoon: "ביניים אחר הצהריים",
  evening: "ארוחת ערב",
};

export const foodLogDay = pgTable(
  "food_log_day",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    wakeup: text("wakeup"),
    breakfast: text("breakfast"),
    lunch: text("lunch"),
    afternoon: text("afternoon"),
    evening: text("evening"),
    patientNote: text("patient_note"),
    therapistNote: text("therapist_note"),
    therapistNoteAt: timestamp("therapist_note_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("food_log_day_patient_date_uq").on(t.patientId, t.date),
    index("food_log_day_patient_idx").on(t.patientId, t.date),
  ],
);
