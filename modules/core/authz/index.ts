/**
 * core/authz — the scoping guard. The single enforcement point for the critical
 * requirement: no code obtains DB access without a tenant scope.
 *
 * - `scopedDbFor(db, session)` turns a verified session into a `TherapistDb` or
 *   `PatientDb` (see ./internal/scoped-db) — the only DB surface domain modules
 *   and app routes are allowed to touch.
 * - `getTherapistDb()` / `getPatientDb()` (in ./server) resolve the request
 *   session, enforce the role, and hand back the scoped handle.
 *
 * Importing `@/modules/core/data/client` (the raw handle) is lint-banned
 * everywhere except core/data, core/auth and this module.
 */
import type { Db } from "@/modules/core/data/client";
import type { ActiveSession } from "@/modules/core/auth";
import { PatientDb, TherapistDb, type ScopedDb } from "./internal/scoped-db";

export { TherapistDb, PatientDb };
export { DbNotConfiguredError } from "@/modules/core/data/client";
export type { ScopedDb };
export type { TherapistScopedTable, PatientScopedTable } from "./internal/scoped-db";

export function scopedDbFor(db: Db, session: ActiveSession): ScopedDb {
  if (session.role === "therapist") {
    return new TherapistDb(db, session.therapistId);
  }
  if (!session.patientId) {
    throw new Error("patient session without patient_id");
  }
  return new PatientDb(db, session.therapistId, session.patientId);
}
