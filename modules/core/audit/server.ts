import "server-only";
import { getCurrentSession, requestContext } from "@/modules/core/auth/server";
import { recordAudit } from "./index";
import type { AuditAction } from "./schema";

/**
 * Record an audit event for the current request. Pulls the actor + IP from the
 * session/headers. No-ops (with a warning) if there is no session — callers that
 * audit pre-auth events (login_failed) pass `actor` explicitly.
 */
export async function audit(
  action: AuditAction,
  entity: string,
  opts: {
    entityId?: string;
    patientId?: string;
    meta?: Record<string, unknown>;
    /** for pre-session events */
    actor?: { therapistId: string; userId?: string; role: "therapist" | "patient" | "system" };
  } = {},
): Promise<void> {
  const { ip } = await requestContext();

  if (opts.actor) {
    await recordAudit({
      therapistId: opts.actor.therapistId,
      actorUserId: opts.actor.userId ?? null,
      actorRole: opts.actor.role,
      action,
      entity,
      entityId: opts.entityId ?? null,
      patientId: opts.patientId ?? null,
      ip,
      meta: opts.meta ?? null,
    });
    return;
  }

  const session = await getCurrentSession();
  if (!session) {
    console.warn(`[audit] no session for ${action} ${entity}; skipped`);
    return;
  }
  await recordAudit({
    therapistId: session.therapistId,
    actorUserId: session.userId,
    actorRole: session.role,
    action,
    entity,
    entityId: opts.entityId ?? null,
    patientId: opts.patientId ?? session.patientId,
    ip,
    meta: opts.meta ?? null,
  });
}
