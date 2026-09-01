import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  lt,
  or,
  type SQL,
  type InferSelectModel,
} from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { patient } from "@/modules/patients/schema";
import { recordEvent } from "@/modules/patient-file";
import { deleteFile } from "@/modules/core/files";
import { document } from "./schema";
import type { DocumentKind, DocumentVisibility } from "./labels";

export {
  documentKind,
  documentVisibility,
  DOCUMENT_KIND_LABEL,
  DOCUMENT_VISIBILITY_LABEL,
  type DocumentKind,
  type DocumentVisibility,
} from "./labels";
export { documentUploader, type DocumentUploader } from "./schema";

type AnyScoped = TherapistDb | PatientDb;

export type DocumentRow = InferSelectModel<typeof document>;

export type DocumentInput = {
  patientId: string;
  name: string;
  kind: DocumentKind;
  fileKey: string;
  mime: string;
  size: number;
  visibility?: DocumentVisibility;
};

/** A patient may only ever see shared documents — enforced here on every read. */
function scopedWhere(db: AnyScoped, base: SQL): SQL {
  return db.role === "patient"
    ? and(base, eq(document.visibility, "therapist_and_patient"))!
    : base;
}

export async function listDocuments(db: AnyScoped, patientId: string): Promise<DocumentRow[]> {
  return (db as TherapistDb).list(document, {
    where: scopedWhere(db, eq(document.patientId, patientId)),
    orderBy: [desc(document.createdAt)],
    limit: 500,
  });
}

export async function getDocument(db: AnyScoped, id: string): Promise<DocumentRow | null> {
  return (db as TherapistDb).findOne(document, scopedWhere(db, eq(document.id, id)));
}

export type DocumentListItem = DocumentRow & { patientName: string };

/** Recent documents across all of the therapist's patients (dashboard / index). */
export async function listRecentDocuments(
  tdb: TherapistDb,
  limit = 50,
): Promise<DocumentListItem[]> {
  const rows = await tdb.list(document, { orderBy: [desc(document.createdAt)], limit });
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.patientId))];
  const people = await tdb.findMany(patient, inArray(patient.id, ids));
  const nameById = new Map(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  return rows.map((r) => ({ ...r, patientName: nameById.get(r.patientId) ?? "מטופל/ת" }));
}

export async function createDocument(db: AnyScoped, input: DocumentInput): Promise<{ id: string }> {
  // a therapist may only add a document for one of their own patients (a patient
  // handle is already pinned to its own patient_id by the guard)
  if (db.role === "therapist") {
    const p = await db.findOne(patient, eq(patient.id, input.patientId));
    if (!p) throw new Error("patient_not_found");
  }

  // a patient can only ever add a shared document
  const visibility: DocumentVisibility =
    db.role === "patient" ? "therapist_and_patient" : (input.visibility ?? "therapist_only");

  const [row] = await (db as TherapistDb).insert(document, {
    patientId: input.patientId,
    name: input.name.trim().slice(0, 200),
    kind: input.kind,
    fileKey: input.fileKey,
    mime: input.mime,
    size: input.size,
    uploadedBy: db.role,
    visibility,
  });

  await recordEvent(db, {
    patientId: input.patientId,
    type: "document_added",
    summary: `מסמך נוסף — ${row.name}`,
    refId: row.id,
  });

  return { id: row.id };
}

export type SharedDocMeta = {
  name: string;
  kind: DocumentKind;
  mime: string;
  size: number;
};

/**
 * Send one file to several patients at once (WP-63). Each patient gets an
 * independent `document` row (visibility `therapist_and_patient`) pointing at
 * its own blob key — no shared bytes, so a later per-patient delete (WP-64)
 * can't affect anyone else. Every `patientId` is verified against this
 * therapist first; an unknown id aborts the whole batch before any write.
 */
export async function shareDocumentWithPatients(
  tdb: TherapistDb,
  patientIds: string[],
  meta: SharedDocMeta,
  fileKeyFor: (patientId: string) => string,
): Promise<{ id: string; patientId: string }[]> {
  const ids = [...new Set(patientIds)];
  if (ids.length === 0) throw new Error("no_patients");

  const mine = await tdb.findMany(patient, inArray(patient.id, ids));
  if (mine.length !== ids.length) throw new Error("patient_not_found");

  const name = meta.name.trim().slice(0, 200);
  const out: { id: string; patientId: string }[] = [];
  for (const patientId of ids) {
    const [row] = await tdb.insert(document, {
      patientId,
      name,
      kind: meta.kind,
      fileKey: fileKeyFor(patientId),
      mime: meta.mime,
      size: meta.size,
      uploadedBy: "therapist",
      visibility: "therapist_and_patient",
    });
    await recordEvent(tdb, {
      patientId,
      type: "document_added",
      summary: `מסמך נוסף — ${row.name}`,
      refId: row.id,
    });
    out.push({ id: row.id, patientId });
  }
  return out;
}

export async function setDocumentVisibility(
  tdb: TherapistDb,
  id: string,
  visibility: DocumentVisibility,
): Promise<void> {
  const rows = await tdb.update(document, { visibility }, eq(document.id, id));
  if (rows.length === 0) throw new Error("document_not_found");
}

/** Therapist-only delete. Removes the blob too (best-effort). */
export async function deleteDocument(tdb: TherapistDb, id: string): Promise<void> {
  const [row] = await tdb.delete(document, eq(document.id, id));
  if (row?.fileKey) {
    try {
      await deleteFile(row.fileKey as string);
    } catch {
      // orphan blob is harmless; the metadata row is what matters
    }
  }
}

/* --- retention review loop (WP-64) --- */

export const RETENTION_MAX_AGE_DAYS = 365;
export const RETENTION_DEFER_DAYS = 90;
const DAY_MS = 86_400_000;

/** A document is up for review once it is older than a year and not deferred. */
function retentionReviewWhere(): SQL {
  const olderThan = new Date(Date.now() - RETENTION_MAX_AGE_DAYS * DAY_MS);
  const now = new Date();
  return and(
    lt(document.createdAt, olderThan),
    or(isNull(document.retentionDeferUntil), lt(document.retentionDeferUntil, now)),
  )!;
}

/** Documents (with patient names) the therapist needs to decide on. */
export async function listRetentionReview(tdb: TherapistDb): Promise<DocumentListItem[]> {
  const rows = await tdb.list(document, {
    where: retentionReviewWhere(),
    orderBy: [desc(document.createdAt)],
    limit: 500,
  });
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.patientId))];
  const people = await tdb.findMany(patient, inArray(patient.id, ids));
  const nameById = new Map(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  return rows.map((r) => ({ ...r, patientName: nameById.get(r.patientId) ?? "מטופל/ת" }));
}

/** Cheap badge count for the dashboard / documents banner. */
export function countRetentionReview(tdb: TherapistDb): Promise<number> {
  return tdb.count(document, retentionReviewWhere());
}

/** "Keep" — push the next review out by RETENTION_DEFER_DAYS. */
export async function deferRetention(tdb: TherapistDb, id: string): Promise<void> {
  const until = new Date(Date.now() + RETENTION_DEFER_DAYS * DAY_MS);
  const rows = await tdb.update(document, { retentionDeferUntil: until }, eq(document.id, id));
  if (rows.length === 0) throw new Error("document_not_found");
}
