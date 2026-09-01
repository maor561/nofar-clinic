import { and, asc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { recordEvent } from "@/modules/patient-file";
import { appointment } from "@/modules/appointments/schema";
import { treatmentSession } from "@/modules/sessions/schema";
import {
  patient,
  patientTreatmentType,
  consent,
  treatmentType as treatmentTypeTable,
  treatmentSeriesTemplate,
  patientSeries,
  type PatientStatus,
  type TreatmentType,
  type ConsentKind,
} from "./schema";

export type { PatientStatus, TreatmentType, ConsentKind } from "./schema";
export { patientStatus, consentKind } from "./schema";

export const STATUS_LABEL: Record<PatientStatus, string> = {
  active: "פעיל",
  inactive: "לא פעיל",
  completed: "הושלם",
  paused: "מושהה",
};

/** Fallback labels for the three built-ins, in case a record still holds an
 *  old slug (migration 0015 converts them to Hebrew names). */
export const TREATMENT_LABEL: Record<string, string> = {
  naturopathy: "נטורופתיה",
  reflexology: "רפלקסולוגיה",
  nutrition: "תזונה",
};

export type TreatmentTypeRow = typeof treatmentTypeTable.$inferSelect;

/** Active types for pickers; pass `includeInactive` for the settings screen. */
export async function listTreatmentTypes(
  tdb: TherapistDb,
  opts: { includeInactive?: boolean } = {},
): Promise<TreatmentTypeRow[]> {
  return tdb.list(treatmentTypeTable, {
    where: opts.includeInactive ? undefined : eq(treatmentTypeTable.active, true),
    orderBy: [asc(treatmentTypeTable.sortOrder), asc(treatmentTypeTable.name)],
  });
}

export async function createTreatmentType(tdb: TherapistDb, name: string): Promise<void> {
  const clean = name.trim();
  if (!clean || clean.length > 60) throw new Error("invalid_name");
  const existing = await tdb.list(treatmentTypeTable, {});
  if (existing.some((r) => r.name === clean)) throw new Error("duplicate");
  await tdb.insert(treatmentTypeTable, { name: clean, sortOrder: existing.length });
}

/** Rename + propagate to every record that stored the old name (guard-scoped). */
export async function renameTreatmentType(
  tdb: TherapistDb,
  id: string,
  name: string,
): Promise<void> {
  const clean = name.trim();
  if (!clean || clean.length > 60) throw new Error("invalid_name");
  const current = await tdb.findOne(treatmentTypeTable, eq(treatmentTypeTable.id, id));
  if (!current) throw new Error("not_found");
  if (current.name === clean) return;

  await tdb.update(treatmentTypeTable, { name: clean }, eq(treatmentTypeTable.id, id));
  const old = current.name;
  await tdb.update(
    patientTreatmentType,
    { treatmentType: clean },
    eq(patientTreatmentType.treatmentType, old),
  );
  await tdb.update(appointment, { treatmentType: clean }, eq(appointment.treatmentType, old));
  await tdb.update(
    treatmentSession,
    { treatmentTypes: sql`array_replace(${treatmentSession.treatmentTypes}, ${old}, ${clean})` },
    sql`${old} = ANY(${treatmentSession.treatmentTypes})`,
  );
}

export async function setTreatmentTypeActive(
  tdb: TherapistDb,
  id: string,
  active: boolean,
): Promise<void> {
  await tdb.update(treatmentTypeTable, { active }, eq(treatmentTypeTable.id, id));
}

// ---- treatment series (WP-56) ----

export type SeriesTemplateRow = typeof treatmentSeriesTemplate.$inferSelect;
export type PatientSeriesRow = typeof patientSeries.$inferSelect;

export async function listSeriesTemplates(
  tdb: TherapistDb,
  opts: { includeInactive?: boolean } = {},
): Promise<SeriesTemplateRow[]> {
  return tdb.list(treatmentSeriesTemplate, {
    where: opts.includeInactive ? undefined : eq(treatmentSeriesTemplate.active, true),
    orderBy: [asc(treatmentSeriesTemplate.sortOrder), asc(treatmentSeriesTemplate.name)],
  });
}

export async function createSeriesTemplate(
  tdb: TherapistDb,
  input: { name: string; sessionCount: number; treatmentType?: string | null },
): Promise<void> {
  const name = input.name.trim();
  const count = Math.round(Number(input.sessionCount));
  if (!name || name.length > 80) throw new Error("invalid_name");
  if (!Number.isFinite(count) || count < 1 || count > 100) throw new Error("invalid_count");
  const existing = await tdb.list(treatmentSeriesTemplate, {});
  if (existing.some((r) => r.name === name)) throw new Error("duplicate");
  await tdb.insert(treatmentSeriesTemplate, {
    name,
    sessionCount: count,
    treatmentType: input.treatmentType?.trim() || null,
    sortOrder: existing.length,
  });
}

export async function updateSeriesTemplate(
  tdb: TherapistDb,
  id: string,
  patch: { name?: string; sessionCount?: number; active?: boolean },
): Promise<void> {
  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    const n = patch.name.trim();
    if (!n || n.length > 80) throw new Error("invalid_name");
    set.name = n;
  }
  if (patch.sessionCount !== undefined) {
    const c = Math.round(Number(patch.sessionCount));
    if (!Number.isFinite(c) || c < 1 || c > 100) throw new Error("invalid_count");
    set.sessionCount = c;
  }
  if (patch.active !== undefined) set.active = patch.active;
  if (Object.keys(set).length === 0) return;
  await tdb.update(treatmentSeriesTemplate, set, eq(treatmentSeriesTemplate.id, id));
}

/** The patient's current active series, or null. Works for either scope. */
export async function getActivePatientSeries(
  db: TherapistDb | PatientDb,
  patientId: string,
): Promise<PatientSeriesRow | null> {
  const rows = await (db as TherapistDb).findMany(
    patientSeries,
    and(eq(patientSeries.patientId, patientId), eq(patientSeries.status, "active")),
  );
  return rows[0] ?? null;
}

/** Snapshot a template onto a patient as their active series. Rejects if one
 *  is already active. */
export async function assignPatientSeries(
  tdb: TherapistDb,
  patientId: string,
  templateId: string,
): Promise<void> {
  const existing = await getActivePatientSeries(tdb, patientId);
  if (existing) throw new Error("series_active_exists");
  const tpl = await tdb.findOne(
    treatmentSeriesTemplate,
    eq(treatmentSeriesTemplate.id, templateId),
  );
  if (!tpl) throw new Error("template_not_found");
  await tdb.insert(patientSeries, {
    patientId,
    name: tpl.name,
    sessionCount: tpl.sessionCount,
    treatmentType: tpl.treatmentType,
  });
  await recordEvent(tdb, {
    patientId,
    type: "status_changed",
    summary: `סדרת טיפול שויכה: ${tpl.name} (${tpl.sessionCount} מפגשים)`,
  });
}

/** One-time flag so the "series ending" notice (WP-59) isn't sent twice. */
export async function markSeriesEndingNotified(tdb: TherapistDb, seriesId: string): Promise<void> {
  await tdb.update(patientSeries, { endingNotifiedAt: new Date() }, eq(patientSeries.id, seriesId));
}

export async function cancelPatientSeries(tdb: TherapistDb, seriesId: string): Promise<void> {
  const [row] = await tdb.update(
    patientSeries,
    { status: "cancelled" },
    and(eq(patientSeries.id, seriesId), eq(patientSeries.status, "active")),
  );
  if (row) {
    await recordEvent(tdb, {
      patientId: row.patientId,
      type: "status_changed",
      summary: `סדרת טיפול בוטלה: ${row.name}`,
    });
  }
}
export const CONSENT_LABEL: Record<ConsentKind, string> = {
  data_processing: "עיבוד מידע רפואי",
  data_transfer_abroad: "העברת מידע לחו״ל (EU)",
  research_future: "שימוש במידע למחקר עתידי (מזוהה חלקית)",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PatientRow = typeof patient.$inferSelect;
export type PatientListItem = PatientRow & { treatmentTypes: TreatmentType[] };
export type PatientDetail = PatientListItem & { consents: ConsentKind[] };

export type PatientInput = {
  firstName: string;
  lastName: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  treatmentGoal?: string | null;
  generalNotes?: string | null;
  status?: PatientStatus;
  treatmentTypes?: TreatmentType[];
  consents?: ConsentKind[];
  /** WP-56 — assign a series at intake. */
  seriesTemplateId?: string | null;
};

async function typesByPatient(
  tdb: TherapistDb,
  ids: string[],
): Promise<Map<string, TreatmentType[]>> {
  const map = new Map<string, TreatmentType[]>();
  if (ids.length === 0) return map;
  const rows = await tdb.findMany(
    patientTreatmentType,
    inArray(patientTreatmentType.patientId, ids),
  );
  for (const r of rows) {
    const list = map.get(r.patientId) ?? [];
    list.push(r.treatmentType);
    map.set(r.patientId, list);
  }
  return map;
}

export async function listPatients(
  tdb: TherapistDb,
  filters: {
    search?: string;
    status?: PatientStatus;
    treatmentType?: TreatmentType;
    limit?: number;
    offset?: number;
  } = {},
): Promise<PatientListItem[]> {
  const conds: SQL[] = [];
  if (filters.status) conds.push(eq(patient.status, filters.status));

  const s = filters.search?.trim();
  if (s) {
    const like = `%${s}%`;
    const parts: (SQL | undefined)[] = [
      ilike(patient.firstName, like),
      ilike(patient.lastName, like),
      ilike(patient.phone, like),
      ilike(patient.email, like),
    ];
    if (UUID_RE.test(s)) parts.push(eq(patient.id, s));
    conds.push(or(...parts.filter(Boolean))!);
  }

  if (filters.treatmentType) {
    const tt = await tdb.findMany(
      patientTreatmentType,
      eq(patientTreatmentType.treatmentType, filters.treatmentType),
    );
    const ids = tt.map((r) => r.patientId);
    if (ids.length === 0) return [];
    conds.push(inArray(patient.id, ids));
  }

  const rows = await tdb.list(patient, {
    where: conds.length ? and(...conds) : undefined,
    orderBy: [asc(patient.lastName), asc(patient.firstName)],
    limit: Math.min(filters.limit ?? 50, 200),
    offset: filters.offset ?? 0,
  });

  const types = await typesByPatient(
    tdb,
    rows.map((r) => r.id),
  );
  return rows.map((r) => ({ ...r, treatmentTypes: types.get(r.id) ?? [] }));
}

export async function getPatient(tdb: TherapistDb, id: string): Promise<PatientDetail | null> {
  const p = await tdb.findOne(patient, eq(patient.id, id));
  if (!p) return null;
  const [tt, cs] = await Promise.all([
    tdb.findMany(patientTreatmentType, eq(patientTreatmentType.patientId, id)),
    tdb.findMany(consent, eq(consent.patientId, id)),
  ]);
  return {
    ...p,
    treatmentTypes: tt.map((r) => r.treatmentType),
    consents: cs.map((r) => r.kind),
  };
}

/** The signed-in patient's own profile (WP-19), through the patient guard. */
export async function getMyProfile(pdb: PatientDb): Promise<PatientDetail | null> {
  const p = await pdb.self();
  if (!p) return null;
  const [tt, cs] = await Promise.all([
    pdb.findMany(patientTreatmentType, eq(patientTreatmentType.patientId, p.id)),
    pdb.findMany(consent, eq(consent.patientId, p.id)),
  ]);
  return {
    ...p,
    treatmentTypes: tt.map((r) => r.treatmentType),
    consents: cs.map((r) => r.kind),
  };
}

export async function createPatient(
  tdb: TherapistDb,
  input: PatientInput,
): Promise<{ id: string }> {
  const [p] = await tdb.insert(patient, {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dob: input.dob || null,
    phone: input.phone || null,
    email: input.email?.trim().toLowerCase() || null,
    address: input.address || null,
    treatmentGoal: input.treatmentGoal || null,
    generalNotes: input.generalNotes || null,
    status: input.status ?? "active",
  });

  if (input.treatmentTypes?.length) {
    await tdb.insert(
      patientTreatmentType,
      input.treatmentTypes.map((treatmentTypeValue) => ({
        patientId: p.id,
        treatmentType: treatmentTypeValue,
      })),
    );
  }
  if (input.consents?.length) {
    await tdb.insert(
      consent,
      input.consents.map((kind) => ({ patientId: p.id, kind })),
    );
  }

  await recordEvent(tdb, {
    patientId: p.id,
    type: "status_changed",
    summary: "המטופל/ת נוספ/ה למערכת",
  });

  if (input.seriesTemplateId) {
    await assignPatientSeries(tdb, p.id, input.seriesTemplateId).catch(() => undefined);
  }

  return { id: p.id };
}

export async function updatePatient(
  tdb: TherapistDb,
  id: string,
  patch: PatientInput,
): Promise<void> {
  const existing = await getPatient(tdb, id);
  if (!existing) throw new Error("patient_not_found");

  const updated = await tdb.update(
    patient,
    {
      firstName: patch.firstName?.trim() ?? existing.firstName,
      lastName: patch.lastName?.trim() ?? existing.lastName,
      dob: patch.dob === undefined ? existing.dob : patch.dob || null,
      phone: patch.phone === undefined ? existing.phone : patch.phone || null,
      email: patch.email === undefined ? existing.email : patch.email?.trim().toLowerCase() || null,
      address: patch.address === undefined ? existing.address : patch.address || null,
      treatmentGoal:
        patch.treatmentGoal === undefined ? existing.treatmentGoal : patch.treatmentGoal || null,
      generalNotes:
        patch.generalNotes === undefined ? existing.generalNotes : patch.generalNotes || null,
      status: patch.status ?? existing.status,
      updatedAt: new Date(),
    },
    eq(patient.id, id),
  );
  if (updated.length === 0) throw new Error("patient_not_found");

  if (patch.status && patch.status !== existing.status) {
    await recordEvent(tdb, {
      patientId: id,
      type: "status_changed",
      summary: `סטטוס: ${STATUS_LABEL[existing.status]} ← ${STATUS_LABEL[patch.status]}`,
    });
  }

  if (patch.treatmentTypes) {
    await tdb.delete(patientTreatmentType, eq(patientTreatmentType.patientId, id));
    if (patch.treatmentTypes.length) {
      await tdb.insert(
        patientTreatmentType,
        patch.treatmentTypes.map((tt) => ({ patientId: id, treatmentType: tt })),
      );
    }
  }
  if (patch.consents) {
    await tdb.delete(consent, eq(consent.patientId, id));
    if (patch.consents.length) {
      await tdb.insert(
        consent,
        patch.consents.map((kind) => ({ patientId: id, kind })),
      );
    }
  }
}

export async function setPatientStatus(
  tdb: TherapistDb,
  id: string,
  status: PatientStatus,
): Promise<void> {
  const existing = await tdb.findOne(patient, eq(patient.id, id));
  if (!existing) throw new Error("patient_not_found");
  await updatePatient(tdb, id, {
    firstName: existing.firstName,
    lastName: existing.lastName,
    status,
  });
}
