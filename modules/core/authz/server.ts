import "server-only";
import { getDb } from "@/modules/core/data/client";
import {
  requireTherapist,
  requirePatient,
  getCurrentSession,
  requestContext,
} from "@/modules/core/auth/server";
import { recordAudit } from "@/modules/core/audit";
import type { ActiveSession } from "@/modules/core/auth";
import { scopedDbFor, type ScopedAuditSink } from "./index";
import type { PatientDb, TherapistDb, ScopedDb } from "./internal/scoped-db";
import { SchedulingView } from "./internal/scheduling-view";

/**
 * Request-scoped entry points. A route / RSC loader / server action calls one of
 * these to get its DB handle — there is no other sanctioned path to the database
 * from app or domain code. Every write through the handle is auto-audited.
 */

function auditSink(session: ActiveSession, ip: string | null): ScopedAuditSink {
  return (evt) => {
    void recordAudit({
      therapistId: session.therapistId,
      actorUserId: session.userId,
      actorRole: session.role,
      action: evt.action,
      entity: evt.entity,
      entityId: evt.entityId,
      patientId: evt.patientId ?? session.patientId,
      ip,
      meta: evt.count > 1 ? { count: evt.count } : null,
    });
  };
}

export async function getTherapistDb(): Promise<TherapistDb> {
  const session = await requireTherapist(); // redirects if not a therapist
  const { ip } = await requestContext();
  return scopedDbFor(getDb(), session, auditSink(session, ip)) as TherapistDb;
}

export async function getPatientDb(): Promise<PatientDb> {
  const session = await requirePatient(); // redirects if not a patient
  const { ip } = await requestContext();
  return scopedDbFor(getDb(), session, auditSink(session, ip)) as PatientDb;
}

/** For places that handle both roles. Null when signed out. */
export async function getScopedDb(): Promise<ScopedDb | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  const { ip } = await requestContext();
  return scopedDbFor(getDb(), session, auditSink(session, ip));
}

/**
 * Read-only view of the current user's therapist scheduling surface (config +
 * opaque busy ranges), for the patient self-booking screen. `therapistId` is
 * taken from the session. Null when signed out. See ADR-040.
 */
export async function getSchedulingView(): Promise<SchedulingView | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  return new SchedulingView(getDb(), session.therapistId);
}

export { SchedulingView };
