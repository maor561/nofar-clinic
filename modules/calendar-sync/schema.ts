import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";

/**
 * Google Calendar connection — one per therapist (WP-32). The OAuth refresh
 * token is stored encrypted (AES-256-GCM, key `CALENDAR_TOKEN_KEY`); it never
 * sits in the DB in the clear. See ADR-041.
 */
export const calendarConnection = pgTable("calendar_connection", {
  therapistId: uuid("therapist_id")
    .primaryKey()
    .references(() => therapist.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("google"),
  refreshTokenEnc: text("refresh_token_enc").notNull(),
  calendarId: text("calendar_id").notNull().default("primary"),
  syncEnabled: boolean("sync_enabled").notNull().default(true),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
  lastError: text("last_error"),
});
