/**
 * calendar-sync — one-way mirror of the internal diary into the therapist's
 * Google Calendar, plus Google free/busy for the slot engine (WP-32, ADR-041).
 *
 * Infra module (getDb-backed, like core/email / core/notifications). Every
 * public function is keyed by `therapistId`, which callers always take from a
 * verified scoped handle (`tdb.therapistId` / `pdb.therapistId`) — never from
 * user input. Sync is best-effort: failures are recorded on the connection row
 * and never block an appointment write.
 */
import { and, eq } from "drizzle-orm";
import { getDb } from "@/modules/core/data/client";
import { appointment } from "@/modules/appointments/schema";
import { calendarConnection } from "./schema";
import { encryptToken, decryptToken } from "./internal/crypto";
import * as g from "./internal/google";

export { googleConfigured, redirectUri } from "./internal/google";

export type ConnectionStatus = {
  /** OAuth env vars present on this deployment. */
  configured: boolean;
  /** a stored connection row exists. */
  connected: boolean;
  calendarId?: string;
  connectedAt?: Date;
  lastError?: string | null;
};

function appBase(): string {
  return (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function getConnectionStatus(therapistId: string): Promise<ConnectionStatus> {
  const rows = await getDb()
    .select()
    .from(calendarConnection)
    .where(eq(calendarConnection.therapistId, therapistId))
    .limit(1);
  const row = rows[0];
  return {
    configured: g.googleConfigured(),
    connected: !!row,
    calendarId: row?.calendarId,
    connectedAt: row?.connectedAt,
    lastError: row?.lastError ?? null,
  };
}

export function buildAuthUrl(state: string): string {
  return g.authUrl(state);
}

/** Exchange the OAuth code and store the (encrypted) refresh token. */
export async function completeConnection(therapistId: string, code: string): Promise<void> {
  const tokens = await g.exchangeCode(code);
  if (!tokens.refresh_token) {
    throw new Error("no refresh_token from Google (was the app already authorised?)");
  }
  const enc = encryptToken(tokens.refresh_token);
  const db = getDb();
  const existing = await db
    .select({ id: calendarConnection.therapistId })
    .from(calendarConnection)
    .where(eq(calendarConnection.therapistId, therapistId))
    .limit(1);
  if (existing[0]) {
    await db
      .update(calendarConnection)
      .set({ refreshTokenEnc: enc, connectedAt: new Date(), syncEnabled: true, lastError: null })
      .where(eq(calendarConnection.therapistId, therapistId));
  } else {
    await db.insert(calendarConnection).values({ therapistId, refreshTokenEnc: enc });
  }
}

export async function disconnect(therapistId: string): Promise<void> {
  await getDb().delete(calendarConnection).where(eq(calendarConnection.therapistId, therapistId));
}

async function activeConnection(therapistId: string) {
  if (!g.googleConfigured()) return null;
  const rows = await getDb()
    .select()
    .from(calendarConnection)
    .where(eq(calendarConnection.therapistId, therapistId))
    .limit(1);
  const row = rows[0];
  return row && row.syncEnabled ? row : null;
}

async function recordError(therapistId: string, e: unknown): Promise<void> {
  try {
    await getDb()
      .update(calendarConnection)
      .set({ lastError: String(e instanceof Error ? e.message : e).slice(0, 500) })
      .where(eq(calendarConnection.therapistId, therapistId));
  } catch {
    /* swallow — diagnostics only */
  }
}

async function stampSync(therapistId: string): Promise<void> {
  try {
    await getDb()
      .update(calendarConnection)
      .set({ lastSyncAt: new Date(), lastError: null })
      .where(eq(calendarConnection.therapistId, therapistId));
  } catch {
    /* ignore */
  }
}

async function writeEventId(
  therapistId: string,
  appointmentId: string,
  eventId: string | null,
): Promise<void> {
  await getDb()
    .update(appointment)
    .set({ gcalEventId: eventId })
    .where(and(eq(appointment.id, appointmentId), eq(appointment.therapistId, therapistId)));
}

export type SyncAppointment = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  patientFirstName: string;
  gcalEventId: string | null;
  cancelled?: boolean;
};

/**
 * Best-effort mirror of one appointment. Returns the Google event id (new or
 * existing), or null when not connected / on error. Writes `gcal_event_id` back
 * onto the appointment row.
 */
export async function syncAppointment(
  therapistId: string,
  appt: SyncAppointment,
): Promise<string | null> {
  const conn = await activeConnection(therapistId);
  if (!conn) return null;

  try {
    const token = await g.accessTokenFrom(decryptToken(conn.refreshTokenEnc));

    if (appt.cancelled) {
      if (appt.gcalEventId) await g.deleteEvent(token, conn.calendarId, appt.gcalEventId);
      await writeEventId(therapistId, appt.id, null);
      await stampSync(therapistId);
      return null;
    }

    const event: g.CalEvent = {
      summary: `פגישה — ${appt.patientFirstName}`.trim(),
      description: `נקבע במערכת של נופר\n${appBase()}/t/calendar/${appt.id}`,
      startsAt: appt.startsAt,
      endsAt: appt.endsAt,
    };

    let eventId = appt.gcalEventId;
    if (eventId) {
      await g.patchEvent(token, conn.calendarId, eventId, event);
    } else {
      eventId = await g.insertEvent(token, conn.calendarId, event);
      await writeEventId(therapistId, appt.id, eventId);
    }
    await stampSync(therapistId);
    return eventId;
  } catch (e) {
    await recordError(therapistId, e);
    return null;
  }
}

/** Google busy ranges for the slot engine. `[]` when not connected / on error. */
export async function googleBusy(
  therapistId: string,
  from: Date,
  to: Date,
): Promise<{ start: Date; end: Date }[]> {
  const conn = await activeConnection(therapistId);
  if (!conn) return [];
  try {
    const token = await g.accessTokenFrom(decryptToken(conn.refreshTokenEnc));
    return await g.freeBusy(token, conn.calendarId, from, to);
  } catch (e) {
    await recordError(therapistId, e);
    return [];
  }
}
