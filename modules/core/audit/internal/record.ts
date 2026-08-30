import { and, desc, eq, gte, lte, lt, sql } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import { auditLog, type AuditAction, type AuditActorRole } from "../schema";

export type AuditEntry = {
  therapistId: string;
  actorUserId?: string | null;
  actorRole: AuditActorRole;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  patientId?: string | null;
  ip?: string | null;
  meta?: Record<string, unknown> | null;
};

/**
 * Append a row. Never throws into the caller — an audit failure must not fail the
 * primary action; it is logged instead. (Fail-open; revisit for the security
 * review / WP-21.)
 */
export async function recordAudit(db: Db, entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      therapistId: entry.therapistId,
      actorUserId: entry.actorUserId ?? null,
      actorRole: entry.actorRole,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      patientId: entry.patientId ?? null,
      ip: entry.ip ?? null,
      meta: entry.meta ?? null,
    });
  } catch (e) {
    console.error("[audit] failed to record", entry.action, entry.entity, e);
  }
}

export type AuditFilters = {
  patientId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
};

/** Query the therapist's own audit trail (always scoped to therapistId). */
export async function queryAudit(db: Db, therapistId: string, filters: AuditFilters = {}) {
  const conds = [eq(auditLog.therapistId, therapistId)];
  if (filters.patientId) conds.push(eq(auditLog.patientId, filters.patientId));
  if (filters.action) conds.push(eq(auditLog.action, filters.action));
  if (filters.from) conds.push(gte(auditLog.at, filters.from));
  if (filters.to) conds.push(lte(auditLog.at, filters.to));

  return db
    .select()
    .from(auditLog)
    .where(and(...conds))
    .orderBy(desc(auditLog.at))
    .limit(Math.min(filters.limit ?? 100, 500))
    .offset(filters.offset ?? 0);
}

/**
 * Retention cleanup — not scheduled yet (WP-21). The append-only trigger blocks
 * DELETE, so the maintenance job briefly disables it inside a transaction.
 */
export async function purgeOldAudit(db: Db, olderThan: Date): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`ALTER TABLE audit_log DISABLE TRIGGER audit_log_append_only`);
    await tx.delete(auditLog).where(lt(auditLog.at, olderThan));
    await tx.execute(sql`ALTER TABLE audit_log ENABLE TRIGGER audit_log_append_only`);
  });
}
