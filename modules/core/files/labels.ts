/**
 * Pure upload constraints — safe to import from client components (no
 * `@vercel/blob`). The service module re-exports these.
 */
export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

export const ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;
export type AllowedMime = (typeof ALLOWED_MIME)[number];

export function isAllowedMime(mime: string): mime is AllowedMime {
  return (ALLOWED_MIME as readonly string[]).includes(mime);
}
