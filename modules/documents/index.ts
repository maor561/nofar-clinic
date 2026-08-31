import { and, desc, eq, type SQL, type InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
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

export async function createDocument(db: AnyScoped, input: DocumentInput): Promise<{ id: string }> {
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
