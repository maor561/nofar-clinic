import { put, get, del } from "@vercel/blob";

/**
 * core/files (WP-08) — a thin wrapper over Vercel Blob, PRIVATE access only.
 * Blobs are never public: a file is reachable only through a scoped route
 * handler that checks the guard + per-document visibility (see
 * `app/api/documents/[id]`). Keys are opaque (`p/<patientId>/<uuid>-<name>`).
 *
 * `@vercel/blob` reads `BLOB_READ_WRITE_TOKEN` from the environment.
 */

export { MAX_FILE_BYTES, ALLOWED_MIME, isAllowedMime, type AllowedMime } from "./labels";

export async function putFile(
  key: string,
  body: ArrayBuffer | Blob | Buffer | string,
  contentType: string,
): Promise<{ key: string }> {
  const res = await put(key, body, {
    access: "private",
    addRandomSuffix: false,
    contentType,
  });
  return { key: res.pathname };
}

export type FileStream = {
  stream: ReadableStream<Uint8Array>;
  contentType: string;
  size: number;
};

export async function getFileStream(key: string): Promise<FileStream | null> {
  const res = await get(key, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  return { stream: res.stream, contentType: res.blob.contentType, size: res.blob.size };
}

export async function deleteFile(key: string): Promise<void> {
  await del(key);
}
