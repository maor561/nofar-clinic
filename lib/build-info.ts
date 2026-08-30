/**
 * Build stamp, inlined at build time via next.config.ts `env`. Use it to confirm
 * which commit is live: GET /api/version, or the footer on the home page.
 */
export const buildInfo = {
  sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? "unknown",
  shortSha: process.env.NEXT_PUBLIC_BUILD_SHA_SHORT ?? "unknown",
  ref: process.env.NEXT_PUBLIC_BUILD_REF ?? "local",
  message: process.env.NEXT_PUBLIC_BUILD_MESSAGE ?? "",
  builtAt: process.env.NEXT_PUBLIC_BUILT_AT ?? "",
} as const;
