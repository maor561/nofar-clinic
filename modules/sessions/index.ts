import { and, desc, eq, inArray, isNotNull, type SQL } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { patient } from "@/modules/patients/schema";
import { appointment } from "@/modules/appointments/schema";
import { recordEvent } from "@/modules/patient-file";
import {
  fieldDefinitionsFor,
  setFieldValuesIn,
  getFieldValuesFrom,
  type FieldValueOut,
} from "@/modules/core/fields";
import { treatmentSession } from "./schema";

export { SESSION_SECTIONS, type SessionSectionKey } from "./sections";

export const SESSION_FIELD_ENTITY = "treatment_session" as const;

export type SessionRow = InferSelectModel<typeof treatmentSession>;
export type SessionListItem = SessionRow & { patientName: string };
export type SessionDetail = SessionListItem & { fields: FieldValueOut[] };

export type SessionInput = {
  patientId: string;
  date: string;
  appointmentId?: string | null;
  treatmentTypes?: string[];
  patientReport?: string | null;
  complaints?: string | null;
  changesSinceLast?: string | null;
  treatmentDone?: string | null;
  therapistNotes?: string | null;
  recommendations?: string | null;
  nextFocus?: string | null;
  /** WP-61 — the explicit "what to share" note; emailed to the patient on save. */
  patientSummary?: string | null;
};

export type FieldWriteInput = { definitionId: string; value: unknown };

function textCols(input: Partial<SessionInput>) {
  return {
    ...(input.treatmentTypes !== undefined ? { treatmentTypes: input.treatmentTypes } : {}),
    patientReport: input.patientReport ?? null,
    complaints: input.complaints ?? null,
    changesSinceLast: input.changesSinceLast ?? null,
    treatmentDone: input.treatmentDone ?? null,
    therapistNotes: input.therapistNotes ?? null,
    recommendations: input.recommendations ?? null,
    nextFocus: input.nextFocus ?? null,
    patientSummary: input.patientSummary ?? null,
  };
}

/** Trim to a non-empty string, or null. */
function clean(s: string | null | undefined): string | null {
  const t = (s ?? "").trim();
  return t.length ? t : null;
}

/** Definitions to render the per-domain metric inputs for the session flow. */
export function sessionFieldDefs(tdb: TherapistDb) {
  return fieldDefinitionsFor(tdb.therapistId, SESSION_FIELD_ENTITY);
}

async function withNames(tdb: TherapistDb, rows: SessionRow[]): Promise<SessionListItem[]> {
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.patientId))];
  const people = await tdb.findMany(patient, inArray(patient.id, ids));
  const nameById = new Map(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  return rows.map((r) => ({ ...r, patientName: nameById.get(r.patientId) ?? "מטופל/ת" }));
}

export async function listSessions(
  tdb: TherapistDb,
  filter: { patientId?: string; limit?: number; offset?: number } = {},
): Promise<SessionListItem[]> {
  const conds: SQL[] = [];
  if (filter.patientId) conds.push(eq(treatmentSession.patientId, filter.patientId));
  const rows = await tdb.list(treatmentSession, {
    where: conds.length ? and(...conds) : undefined,
    orderBy: [desc(treatmentSession.date), desc(treatmentSession.createdAt)],
    limit: Math.min(filter.limit ?? 100, 500),
    offset: filter.offset ?? 0,
  });
  return withNames(tdb, rows);
}

export async function getSession(tdb: TherapistDb, id: string): Promise<SessionDetail | null> {
  const row = await tdb.findOne(treatmentSession, eq(treatmentSession.id, id));
  if (!row) return null;
  const [[withName], fields] = await Promise.all([
    withNames(tdb, [row]),
    getFieldValuesFrom(
      { therapistId: tdb.therapistId, patientId: row.patientId },
      SESSION_FIELD_ENTITY,
      id,
    ),
  ]);
  return { ...withName, fields };
}

/** Confirm an appointment id is this therapist's AND for this patient. */
async function assertAppointment(
  tdb: TherapistDb,
  appointmentId: string,
  patientId: string,
): Promise<void> {
  const appt = await tdb.findOne(
    appointment,
    and(eq(appointment.id, appointmentId), eq(appointment.patientId, patientId)),
  );
  if (!appt) throw new Error("appointment_not_found");
}

const summaryDateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });
function summary(input: SessionInput): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(input.date)
    ? summaryDateFmt.format(new Date(`${input.date}T12:00:00Z`))
    : input.date;
  return `תיעוד מפגש — ${d}`;
}

export async function createSession(
  tdb: TherapistDb,
  input: SessionInput,
  fieldWrites: FieldWriteInput[] = [],
): Promise<{ id: string; sharedSummary: string | null }> {
  // the patient must be this therapist's (scoped) before we write anything for them
  const p = await tdb.findOne(patient, eq(patient.id, input.patientId));
  if (!p) throw new Error("patient_not_found");

  if (input.appointmentId) await assertAppointment(tdb, input.appointmentId, input.patientId);

  const [row] = await tdb.insert(treatmentSession, {
    patientId: input.patientId,
    appointmentId: input.appointmentId ?? null,
    date: input.date,
    ...textCols(input),
  });

  if (fieldWrites.length) {
    await setFieldValuesIn(
      { therapistId: tdb.therapistId, patientId: input.patientId },
      SESSION_FIELD_ENTITY,
      row.id,
      fieldWrites,
    );
  }

  await recordEvent(tdb, {
    patientId: input.patientId,
    type: "session",
    summary: summary(input),
    occurredAt: new Date(`${input.date}T12:00:00Z`),
    refId: row.id,
  });

  return { id: row.id, sharedSummary: clean(input.patientSummary) };
}

export async function updateSession(
  tdb: TherapistDb,
  id: string,
  patch: Partial<SessionInput>,
  fieldWrites: FieldWriteInput[] = [],
): Promise<{ patientId: string; sharedSummary: string | null }> {
  const existing = await tdb.findOne(treatmentSession, eq(treatmentSession.id, id));
  if (!existing) throw new Error("session_not_found");

  // a summary is (re)shared only when it is newly set or its text changed
  const nextSummary = patch.patientSummary === undefined ? null : clean(patch.patientSummary);
  const sharedSummary =
    nextSummary && nextSummary !== clean(existing.patientSummary) ? nextSummary : null;

  if (patch.appointmentId) await assertAppointment(tdb, patch.appointmentId, existing.patientId);

  const updated = await tdb.update(
    treatmentSession,
    {
      date: patch.date ?? existing.date,
      appointmentId:
        patch.appointmentId === undefined ? existing.appointmentId : (patch.appointmentId ?? null),
      ...textCols({ ...existing, ...patch }),
      updatedAt: new Date(),
    },
    eq(treatmentSession.id, id),
  );
  if (updated.length === 0) throw new Error("session_not_found");

  if (fieldWrites.length) {
    await setFieldValuesIn(
      { therapistId: tdb.therapistId, patientId: existing.patientId },
      SESSION_FIELD_ENTITY,
      id,
      fieldWrites,
    );
  }

  return { patientId: existing.patientId, sharedSummary };
}

/** Sessions whose therapist chose to share a summary — patient-facing (WP-61). */
export async function listSharedSummaries(
  pdb: PatientDb,
): Promise<{ id: string; date: string; treatmentTypes: string[]; summary: string }[]> {
  const rows = await (pdb as unknown as TherapistDb).list(treatmentSession, {
    where: isNotNull(treatmentSession.patientSummary),
    orderBy: [desc(treatmentSession.date), desc(treatmentSession.createdAt)],
    limit: 200,
  });
  return rows
    .filter((r) => (r.patientSummary ?? "").trim().length > 0)
    .map((r) => ({
      id: r.id,
      date: r.date,
      treatmentTypes: r.treatmentTypes,
      summary: r.patientSummary!.trim(),
    }));
}
