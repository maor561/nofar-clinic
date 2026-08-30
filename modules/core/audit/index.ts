/**
 * core/audit — the audit trail. Append-only (service exposes no mutation; a DB
 * trigger blocks UPDATE/DELETE). Every write to patient data is recorded
 * automatically by the scoping guard's ScopedDb; auth events and screen-level
 * reads are recorded explicitly via `audit()` in core/audit/server.
 */
import { getDb } from "@/modules/core/data/client";
import {
  recordAudit as _recordAudit,
  queryAudit as _queryAudit,
  purgeOldAudit as _purgeOldAudit,
  type AuditEntry,
  type AuditFilters,
} from "./internal/record";

export type { AuditEntry, AuditFilters };
export type { AuditAction, AuditActorRole } from "./schema";

/** ~2 years (docs/DATA_MODEL.md). Enforcement job is WP-21. */
export const AUDIT_RETENTION_DAYS = 730;

export function recordAudit(entry: AuditEntry): Promise<void> {
  return _recordAudit(getDb(), entry);
}

export function queryAudit(therapistId: string, filters?: AuditFilters) {
  return _queryAudit(getDb(), therapistId, filters);
}

export function purgeOldAudit(olderThan: Date): Promise<void> {
  return _purgeOldAudit(getDb(), olderThan);
}
