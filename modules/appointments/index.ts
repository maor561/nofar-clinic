import { and, asc, desc, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { TherapistDb, type PatientDb } from "@/modules/core/authz";
import type { TreatmentType } from "@/modules/patients";
import { patient, patientSeries } from "@/modules/patients/schema";
import { recordEvent } from "@/modules/patient-file";
import { appointment, type AppointmentStatus } from "./schema";

export type SeriesProgress = {
  id: string;
  name: string;
  sessionCount: number;
  usedCount: number;
  remaining: number;
  justCompleted: boolean;
  endingNotifiedAt: Date | null;
};

export type { AppointmentStatus } from "./schema";
export { appointmentStatus } from "./schema";

export const APPT_STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "מתוכננת",
  done: "התקיימה",
  cancelled: "בוטלה",
  no_show: "לא הגיע/ה",
};

export type AppointmentRow = InferSelectModel<typeof appointment>;
export type AppointmentListItem = AppointmentRow & { patientName: string };

export type AppointmentInput = {
  patientId: string;
  startsAt: Date;
  endsAt: Date;
  treatmentType?: TreatmentType | null;
  notes?: string | null;
};

export type AppointmentFilter = {
  from?: Date;
  to?: Date;
  patientId?: string;
  status?: AppointmentStatus | AppointmentStatus[];
  ascending?: boolean;
  limit?: number;
  offset?: number;
};

const MAX_PAGE = 500;

function conds(f: AppointmentFilter): SQL | undefined {
  const c: SQL[] = [];
  if (f.from) c.push(gte(appointment.startsAt, f.from));
  if (f.to) c.push(lte(appointment.startsAt, f.to));
  if (f.patientId) c.push(eq(appointment.patientId, f.patientId));
  if (f.status) {
    const s = Array.isArray(f.status) ? f.status : [f.status];
    if (s.length) c.push(inArray(appointment.status, s));
  }
  return c.length ? and(...c) : undefined;
}

function fmtWhen(d: Date): string {
  return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

/**
 * Raw diary rows, guard-scoped. Works for either handle — a `PatientDb` only
 * ever sees its own rows. No name join (a patient reads their own list).
 */
export async function listAppointmentRows(
  db: TherapistDb | PatientDb,
  filter: AppointmentFilter = {},
): Promise<AppointmentRow[]> {
  return (db as TherapistDb).list(appointment, {
    where: conds(filter),
    orderBy: filter.ascending ? [asc(appointment.startsAt)] : [desc(appointment.startsAt)],
    limit: Math.min(filter.limit ?? MAX_PAGE, MAX_PAGE),
    offset: filter.offset ?? 0,
  });
}

/** Therapist diary with each patient's display name attached (second query). */
export async function listAppointments(
  tdb: TherapistDb,
  filter: AppointmentFilter = {},
): Promise<AppointmentListItem[]> {
  const rows = await listAppointmentRows(tdb, filter);
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.patientId))];
  const people = await tdb.findMany(patient, inArray(patient.id, ids));
  const nameById = new Map(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  return rows.map((r) => ({ ...r, patientName: nameById.get(r.patientId) ?? "מטופל/ת" }));
}

export async function getAppointment(
  tdb: TherapistDb,
  id: string,
): Promise<AppointmentListItem | null> {
  const row = await tdb.findOne(appointment, eq(appointment.id, id));
  if (!row) return null;
  const p = await tdb.findOne(patient, eq(patient.id, row.patientId));
  return { ...row, patientName: p ? `${p.firstName} ${p.lastName}` : "מטופל/ת" };
}

export async function createAppointment(
  tdb: TherapistDb,
  input: AppointmentInput,
): Promise<{ id: string }> {
  const p = await tdb.findOne(patient, eq(patient.id, input.patientId));
  if (!p) throw new Error("patient_not_found");

  const [row] = await tdb.insert(appointment, {
    patientId: input.patientId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    treatmentType: input.treatmentType ?? null,
    notes: input.notes ?? null,
    status: "scheduled",
  });

  await recordEvent(tdb, {
    patientId: input.patientId,
    type: "appointment",
    summary: `פגישה נקבעה — ${fmtWhen(input.startsAt)}`,
    occurredAt: input.startsAt,
    refId: row.id,
  });

  return { id: row.id };
}

/**
 * A patient books their own appointment from an open slot (WP-29). The guard
 * forces `patient_id` + `therapist_id` from the scope, so the caller cannot
 * book for anyone else. Availability / lead-time / overlap are validated by the
 * caller (server action) against a fresh `SchedulingView` right before this.
 * Auto-confirmed — status is `scheduled` immediately.
 */
export async function bookSelfAppointment(
  pdb: PatientDb,
  input: { startsAt: Date; endsAt: Date; treatmentType?: TreatmentType | null },
): Promise<{ id: string }> {
  const [row] = await pdb.insert(appointment, {
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    treatmentType: input.treatmentType ?? null,
    notes: null,
    status: "scheduled",
  });

  await recordEvent(pdb, {
    patientId: pdb.patientId,
    type: "appointment",
    summary: `פגישה נקבעה — ${fmtWhen(input.startsAt)}`,
    occurredAt: input.startsAt,
    refId: row.id,
  });

  return { id: row.id };
}

export async function updateAppointment(
  tdb: TherapistDb,
  id: string,
  patch: Partial<AppointmentInput>,
): Promise<void> {
  const existing = await tdb.findOne(appointment, eq(appointment.id, id));
  if (!existing) throw new Error("appointment_not_found");

  const startsAt = patch.startsAt ?? existing.startsAt;
  const endsAt = patch.endsAt ?? existing.endsAt;
  const rescheduled =
    patch.startsAt != null && patch.startsAt.getTime() !== existing.startsAt.getTime();

  const updated = await tdb.update(
    appointment,
    {
      startsAt,
      endsAt,
      treatmentType:
        patch.treatmentType === undefined ? existing.treatmentType : (patch.treatmentType ?? null),
      notes: patch.notes === undefined ? existing.notes : (patch.notes ?? null),
      updatedAt: new Date(),
    },
    eq(appointment.id, id),
  );
  if (updated.length === 0) throw new Error("appointment_not_found");

  if (rescheduled) {
    await recordEvent(tdb, {
      patientId: existing.patientId,
      type: "appointment",
      summary: `הפגישה הועברה — ${fmtWhen(startsAt)}`,
      occurredAt: startsAt,
      refId: id,
    });
  }
}

const STATUS_EVENT: Record<Exclude<AppointmentStatus, "scheduled">, string> = {
  done: "הפגישה התקיימה",
  cancelled: "הפגישה בוטלה",
  no_show: "המטופל/ת לא הגיע/ה לפגישה",
};

export async function setAppointmentStatus(
  tdb: TherapistDb,
  id: string,
  status: AppointmentStatus,
): Promise<{ patientId: string; series: SeriesProgress | null }> {
  const existing = await tdb.findOne(appointment, eq(appointment.id, id));
  if (!existing) throw new Error("appointment_not_found");

  const updated = await tdb.update(
    appointment,
    { status, updatedAt: new Date() },
    eq(appointment.id, id),
  );
  if (updated.length === 0) throw new Error("appointment_not_found");

  if (status !== "scheduled" && status !== existing.status) {
    await recordEvent(tdb, {
      patientId: existing.patientId,
      type: "appointment",
      summary: `${STATUS_EVENT[status]} — ${fmtWhen(existing.startsAt)}`,
      occurredAt: new Date(),
      refId: id,
    });
  }

  // WP-56: a "done" appointment advances the patient's active series counter.
  let series: SeriesProgress | null = null;
  const delta = status === "done" ? 1 : existing.status === "done" ? -1 : 0;
  if (delta !== 0) {
    const [active] = await tdb.findMany(
      patientSeries,
      and(eq(patientSeries.patientId, existing.patientId), eq(patientSeries.status, "active")),
    );
    // when re-opening a completed series, look for the most recent completed one
    const target =
      active ??
      (delta < 0
        ? (
            await tdb.findMany(
              patientSeries,
              and(
                eq(patientSeries.patientId, existing.patientId),
                eq(patientSeries.status, "completed"),
              ),
            )
          ).at(-1)
        : undefined);
    if (target) {
      const usedCount = Math.max(0, target.usedCount + delta);
      const completed = usedCount >= target.sessionCount;
      const wasCompleted = target.status === "completed";
      await tdb.update(
        patientSeries,
        {
          usedCount,
          status: completed ? "completed" : "active",
          completedAt: completed ? (wasCompleted ? target.completedAt : new Date()) : null,
        },
        eq(patientSeries.id, target.id),
      );
      series = {
        id: target.id,
        name: target.name,
        sessionCount: target.sessionCount,
        usedCount,
        remaining: Math.max(0, target.sessionCount - usedCount),
        justCompleted: completed && !wasCompleted,
        endingNotifiedAt: target.endingNotifiedAt,
      };
    }
  }

  return { patientId: existing.patientId, series };
}

/** The stored value is already the type's display name (WP-55). */
export function treatmentLabel(t: string | null): string | null {
  return t?.trim() || null;
}
