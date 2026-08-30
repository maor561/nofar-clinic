import { pgTable, uuid, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";

/**
 * Therapist ↔ patient conversation (WP-16). DATA_MODEL#message_thread / #message.
 * One thread per patient (v1: a single therapist). Both rows carry therapist_id
 * + patient_id so either scoped handle reaches only its own conversation.
 *
 * `read_at` on a message is when the OTHER party read it: a message the
 * therapist sent is unread until the patient opens the thread, and vice versa.
 */
export const messageSender = ["therapist", "patient"] as const;
export type MessageSender = (typeof messageSender)[number];

export const messageThread = pgTable(
  "message_thread",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("message_thread_patient").on(t.patientId)],
);

export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => messageThread.id, { onDelete: "cascade" }),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patient.id, { onDelete: "cascade" }),
    sender: text("sender", { enum: messageSender }).notNull(),
    body: text("body").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (t) => [
    index("message_thread_sent_idx").on(t.threadId, t.sentAt),
    index("message_unread_idx").on(t.therapistId, t.sender, t.readAt),
  ],
);
