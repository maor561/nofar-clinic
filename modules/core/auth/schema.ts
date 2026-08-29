import { pgTable, uuid, text, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";

/**
 * Auth + identity schema. See docs/DATA_MODEL.md.
 * Sessions are stored server-side (ADR-003); the cookie carries only an opaque
 * random id whose SHA-256 is the row key, so a DB leak does not yield live sessions.
 */

export const userRole = ["therapist", "patient"] as const;
export type UserRole = (typeof userRole)[number];

export const userStatus = ["active", "invited", "disabled"] as const;
export type UserStatus = (typeof userStatus)[number];

/** Single therapist in v1, but the table + therapist_id exist from the start (ADR-005). */
export const therapist = pgTable("therapist", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const user = pgTable(
  "user",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    role: text("role", { enum: userRole }).notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    totpSecret: text("totp_secret"),
    totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
    status: text("status", { enum: userStatus }).notNull().default("invited"),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    /** set for role = 'patient' */
    patientId: uuid("patient_id"),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("user_therapist_idx").on(t.therapistId)],
);

export const session = pgTable(
  "session",
  {
    /** SHA-256 hex of the opaque cookie value. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

/** One-click patient invite (magic link). token_hash = SHA-256 hex of the emailed token. */
export const invite = pgTable(
  "invite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    patientId: uuid("patient_id").notNull(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("invite_patient_idx").on(t.patientId)],
);

export const passwordReset = pgTable(
  "password_reset",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    ip: text("ip"),
  },
  (t) => [index("password_reset_user_idx").on(t.userId)],
);

/** Lightweight log for IP-based rate limiting + a security audit trail. */
export const loginAttempt = pgTable(
  "login_attempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    ip: text("ip"),
    success: boolean("success").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("login_attempt_ip_at_idx").on(t.ip, t.at),
    index("login_attempt_email_at_idx").on(t.email, t.at),
  ],
);
