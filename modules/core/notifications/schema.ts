import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { therapist, user } from "@/modules/core/auth/schema";

/**
 * In-app notifications (DATA_MODEL#notification). One row per recipient. Critical
 * types also send an email (core/email) and set `emailed_at`.
 */
export const notificationType = [
  "patient_joined",
  "password_changed",
  "appointment_upcoming",
  "appointment_scheduled",
  "appointment_changed",
  "appointment_cancelled",
  "plan_changed",
  "task_assigned",
  "task_completed",
  "message_received",
  "document_shared",
  "questionnaire_submitted",
  "series_ending",
  "series_completed",
  "generic",
] as const;
export type NotificationType = (typeof notificationType)[number];

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    type: text("type", { enum: notificationType }).notNull(),
    titleHe: text("title_he").notNull(),
    bodyHe: text("body_he"),
    link: text("link"),
    meta: jsonb("meta"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
    emailedAt: timestamp("emailed_at", { withTimezone: true }),
  },
  (t) => [index("notification_recipient_idx").on(t.recipientUserId, t.createdAt)],
);
