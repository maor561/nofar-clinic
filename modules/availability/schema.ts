import {
  pgTable,
  uuid,
  integer,
  boolean,
  date,
  text,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";

/**
 * Availability + self-scheduling (WP-28). All three tables are therapist-scoped
 * only — they hold the therapist's own diary configuration, never patient data.
 * The patient self-booking flow reads them through `SchedulingView` (core/authz),
 * which also exposes opaque busy ranges. See ADR-039 / ADR-040.
 */

/** Recurring weekly working hours. One window per weekday for v1. */
export const availabilityRule = pgTable(
  "availability_rule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "cascade" }),
    /** 0 = Sunday … 6 = Saturday, in clinic time. */
    weekday: integer("weekday").notNull(),
    /** minutes from clinic midnight (e.g. 540 = 09:00). */
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("availability_rule_therapist_idx").on(t.therapistId),
    unique("availability_rule_therapist_weekday_uq").on(t.therapistId, t.weekday),
  ],
);

/** A single blocked clinic date (vacation / day off) — removes all slots that day. */
export const availabilityException = pgTable(
  "availability_exception",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "cascade" }),
    /** 'YYYY-MM-DD', clinic date. */
    date: date("date").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("availability_exception_therapist_date_uq").on(t.therapistId, t.date)],
);

/** One row per therapist — the self-scheduling policy. */
export const bookingPolicy = pgTable("booking_policy", {
  therapistId: uuid("therapist_id")
    .primaryKey()
    .references(() => therapist.id, { onDelete: "cascade" }),
  /** master switch — off by default; the therapist turns it on when ready. */
  selfSchedulingEnabled: boolean("self_scheduling_enabled").notNull().default(false),
  /** appointment length a patient books, minutes. */
  slotMinutes: integer("slot_minutes").notNull().default(60),
  /** start times are offered every N minutes within a window. */
  granularityMinutes: integer("granularity_minutes").notNull().default(30),
  /** a patient cannot book less than this many hours ahead. */
  leadHours: integer("lead_hours").notNull().default(12),
  /** a patient cannot book further than this many days ahead. */
  horizonDays: integer("horizon_days").notNull().default(45),
  /** gap kept clear before and after each appointment, minutes. */
  bufferMinutes: integer("buffer_minutes").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
