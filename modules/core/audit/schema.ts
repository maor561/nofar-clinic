import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { therapist } from "@/modules/core/auth/schema";

/**
 * Append-only audit trail. See docs/DATA_MODEL.md. Writes only — no update/delete
 * path in the service, and a DB trigger blocks mutation (migration 0002).
 * Retention: 2 years (purge job wired in WP-21).
 */
export const auditAction = [
  "view",
  "create",
  "update",
  "delete",
  "login",
  "login_failed",
  "invite",
  "export",
] as const;
export type AuditAction = (typeof auditAction)[number];

export const auditActorRole = ["therapist", "patient", "system"] as const;
export type AuditActorRole = (typeof auditActorRole)[number];

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    therapistId: uuid("therapist_id")
      .notNull()
      .references(() => therapist.id, { onDelete: "restrict" }),
    actorUserId: uuid("actor_user_id"),
    actorRole: text("actor_role", { enum: auditActorRole }).notNull(),
    action: text("action", { enum: auditAction }).notNull(),
    entity: text("entity").notNull(),
    entityId: uuid("entity_id"),
    patientId: uuid("patient_id"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    ip: text("ip"),
    meta: jsonb("meta"),
  },
  (t) => [
    index("audit_log_therapist_at_idx").on(t.therapistId, t.at),
    index("audit_log_patient_at_idx").on(t.patientId, t.at),
  ],
);
