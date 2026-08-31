import { getScopedDb } from "@/modules/core/authz/server";
import { getDocument } from "@/modules/documents";
import { getFileStream } from "@/modules/core/files";
import { audit } from "@/modules/core/audit/server";

/**
 * The ONLY way to reach a document's bytes. Verifies the scoped handle owns the
 * row (and, for a patient, that it is shared) before streaming the private blob.
 * No public blob URL is ever exposed.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const db = await getScopedDb();
  if (!db) return new Response("unauthorized", { status: 401 });

  const doc = await getDocument(db, id);
  if (!doc) return new Response("not found", { status: 404 });

  const file = await getFileStream(doc.fileKey);
  if (!file) return new Response("file missing", { status: 404 });

  await audit("view", "document", { patientId: doc.patientId, entityId: id });

  const name = encodeURIComponent(doc.name);
  return new Response(file.stream, {
    headers: {
      "content-type": doc.mime || file.contentType || "application/octet-stream",
      "content-length": String(file.size ?? doc.size),
      "content-disposition": `inline; filename*=UTF-8''${name}`,
      "cache-control": "private, no-store",
    },
  });
}
