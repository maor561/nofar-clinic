"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatientUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { putFile, isAllowedMime, MAX_FILE_BYTES } from "@/modules/core/files";
import {
  shareDocumentWithPatients,
  deferRetention,
  deleteDocument,
  documentKind,
  type DocumentKind,
} from "@/modules/documents";

export type ShareState = { error?: string; ok?: number };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function safeName(name: string): string {
  return (
    name
      .replace(/[^\p{L}\p{N}.\-_ ]/gu, "")
      .trim()
      .slice(0, 120) || "file"
  );
}

/** Send one uploaded file to every selected patient (WP-63). */
export async function shareToPatientsAction(_prev: ShareState, fd: FormData): Promise<ShareState> {
  const patientIds = fd
    .getAll("patientIds")
    .filter((x): x is string => typeof x === "string" && UUID_RE.test(x));
  if (patientIds.length === 0) return { error: "בחרו לפחות מטופל/ת אחד/ת" };

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "יש לבחור קובץ" };
  if (file.size > MAX_FILE_BYTES) return { error: "הקובץ גדול מדי (עד 15MB)" };
  if (!isAllowedMime(file.type)) return { error: "סוג הקובץ אינו נתמך" };

  const kindRaw = String(fd.get("kind") ?? "other");
  const kind: DocumentKind = (documentKind as readonly string[]).includes(kindRaw)
    ? (kindRaw as DocumentKind)
    : "other";

  const tdb = await getTherapistDb();

  // one blob copy per patient — keeps every row independently deletable
  const bytes = await file.arrayBuffer();
  const keyByPatient = new Map<string, string>();
  try {
    for (const pid of patientIds) {
      const key = `p/${pid}/${randomUUID()}_${safeName(file.name)}`;
      await putFile(key, bytes, file.type);
      keyByPatient.set(pid, key);
    }
  } catch {
    return { error: "העלאת הקובץ נכשלה." };
  }

  let created: { id: string; patientId: string }[];
  try {
    created = await shareDocumentWithPatients(
      tdb,
      patientIds,
      { name: file.name, kind, mime: file.type, size: file.size },
      (pid) => keyByPatient.get(pid)!,
    );
  } catch (e) {
    return {
      error:
        e instanceof Error && e.message === "patient_not_found"
          ? "אחד מהמטופלים שנבחרו אינו תקין"
          : "שמירת המסמך נכשלה.",
    };
  }

  for (const c of created) {
    const uid = await getPatientUserId(c.patientId);
    if (uid) {
      await notify({
        recipientUserId: uid,
        therapistId: tdb.therapistId,
        type: "document_shared",
        titleHe: "מסמך חדש שותף איתך",
        bodyHe: file.name,
        link: "/p/documents",
        meta: { documentId: c.id },
      });
    }
    revalidatePath(`/t/patients/${c.patientId}`);
    revalidatePath(`/t/patients/${c.patientId}/documents`);
  }
  revalidatePath("/t/documents");
  revalidatePath("/p/documents");
  return { ok: created.length };
}

/* --- WP-64 retention review --- */

/** "Keep for another year" — defer the next review by 90 days. */
export async function keepDocumentAction(id: string): Promise<void> {
  const tdb = await getTherapistDb();
  try {
    await deferRetention(tdb, id);
  } catch {
    return;
  }
  revalidatePath("/t/documents/review");
  revalidatePath("/t/documents");
  revalidatePath("/t");
}

/** "Delete now" — remove the row + blob + audit (via the scoped handle). */
export async function deleteReviewedDocumentAction(id: string): Promise<void> {
  const tdb = await getTherapistDb();
  await deleteDocument(tdb, id);
  revalidatePath("/t/documents/review");
  revalidatePath("/t/documents");
  revalidatePath("/t");
  revalidatePath("/p/documents");
}
