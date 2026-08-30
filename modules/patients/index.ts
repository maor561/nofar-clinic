import { and, asc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import type { TherapistDb } from "@/modules/core/authz";
import { recordEvent } from "@/modules/patient-file";
import {
  patient,
  patientTreatmentType,
  consent,
  type PatientStatus,
  type TreatmentType,
  type ConsentKind,
} from "./schema";

export type { PatientStatus, TreatmentType, ConsentKind } from "./schema";
export { patientStatus, treatmentType, consentKind } from "./schema";

export const STATUS_LABEL: Record<PatientStatus, string> = {
  active: "פעיל",
  inactive: "לא פעיל",
  completed: "הושלם",
  paused: "מושהה",
};
export const TREATMENT_LABEL: Record<TreatmentType, string> = {
  naturopathy: "נטורופתיה",
  reflexology: "רפלקסולוגיה",
  nutrition: "תזונה",
};
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
