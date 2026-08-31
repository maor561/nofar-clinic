"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getScopedDb, getTherapistDb } from "@/modules/core/authz/server";
import { getPatientUserId, getTherapistUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { putFile, isAllowedMime, MAX_FILE_BYTES } from "@/modules/core/files";
import {
  createDocument,
  deleteDocument,
  setDocumentVisibility,
  documentKind,
  documentVisibility,
  type DocumentKind,
  type DocumentVisibility,
} from "@/modules/documents";

export type DocFormState = { error?: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeName(name: string): string {
  return (
    name
      .replace(/[^\p{L}\p{N}.\-_ ]/gu, "")
      .trim()
      .slice(0, 120) || "file"
  );
}

/** Upload a document — works for either role via getScopedDb(). */
export async function uploadDocumentAction(
  patientId: string,
  _prev: DocFormState,
  fd: FormData,
): Promise<DocFormState> {
  if (!UUID_RE.test(patientId)) return { error: "מטופל/ת לא תקין/ה" };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "יש לבחור קובץ" };
  if (file.size > MAX_FILE_BYTES) return { error: "הקובץ גדול מדי (עד 15MB)" };
  if (!isAllowedMime(file.type)) return { error: "סוג הקובץ אינו נתמך" };

  const kindRaw = String(fd.get("kind") ?? "other");
  const kind: DocumentKind = (documentKind as readonly string[]).includes(kindRaw)
    ? (kindRaw as DocumentKind)
    : "other";
  const visRaw = String(fd.get("visibility") ?? "therapist_only");
  const visibility: DocumentVisibility = (documentVisibility as readonly string[]).includes(visRaw)
    ? (visRaw as DocumentVisibility)
    : "therapist_only";

  const db = await getScopedDb();
  if (!db) return { error: "יש להתחבר מחדש" };

  const key = `p/${patientId}/${randomUUID()}_${safeName(file.name)}`;
  try {
    await putFile(key, await file.arrayBuffer(), file.type);
  } catch {
    return { error: "העלאת הקובץ נכשלה." };
  }

  let docId: string;
  try {
    ({ id: docId } = await createDocument(db, {
      patientId,
      name: file.name,
      kind,
      fileKey: key,
      mime: file.type,
      size: file.size,
      visibility,
    }));
  } catch {
    return { error: "שמירת המסמך נכשלה." };
  }

  // notify the other side when the document is shared
  if (db.role === "therapist" && visibility === "therapist_and_patient") {
    const uid = await getPatientUserId(patientId);
    if (uid)
      await notify({
        recipientUserId: uid,
        therapistId: db.therapistId,
        type: "document_shared",
        titleHe: "מסמך חדש שותף איתך",
        bodyHe: file.name,
        link: "/p/documents",
        meta: { documentId: docId },
      });
  } else if (db.role === "patient") {
    const uid = await getTherapistUserId(db.therapistId);
    if (uid)
      await notify({
        recipientUserId: uid,
        therapistId: db.therapistId,
        type: "document_shared",
        titleHe: "מטופל/ת העלה/תה מסמך",
        bodyHe: file.name,
        link: `/t/patients/${patientId}/documents`,
        meta: { documentId: docId },
      });
  }

  revalidatePath(`/t/patients/${patientId}/documents`);
  revalidatePath(`/t/patients/${patientId}`);
  revalidatePath("/p/documents");
  return {};
}

export async function setDocVisibilityAction(
  id: string,
  patientId: string,
  visibility: string,
): Promise<void> {
  if (!(documentVisibility as readonly string[]).includes(visibility)) return;
  const tdb = await getTherapistDb();
  try {
    await setDocumentVisibility(tdb, id, visibility as DocumentVisibility);
  } catch {
    return;
  }
  revalidatePath(`/t/patients/${patientId}/documents`);
  revalidatePath("/p/documents");
}

export async function deleteDocumentAction(id: string, patientId: string): Promise<void> {
  const tdb = await getTherapistDb();
  await deleteDocument(tdb, id);
  revalidatePath(`/t/patients/${patientId}/documents`);
  revalidatePath("/p/documents");
  redirect(`/t/patients/${patientId}/documents`);
}
