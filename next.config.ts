import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/** Build stamp — lets you confirm which commit is actually live. */
function buildSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA;
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unknown";
  }
}

const sha = buildSha();

const nextConfig: NextConfig = {
  // Native / WASM-backed packages that must be require()d at runtime, not bundled.
  serverExternalPackages: ["@electric-sql/pglite", "@node-rs/argon2"],
  env: {
    NEXT_PUBLIC_BUILD_SHA: sha,
    NEXT_PUBLIC_BUILD_SHA_SHORT: sha.slice(0, 7),
    NEXT_PUBLIC_BUILD_REF: process.env.VERCEL_GIT_COMMIT_REF ?? "local",
    NEXT_PUBLIC_BUILD_MESSAGE: (process.env.VERCEL_GIT_COMMIT_MESSAGE ?? "")
      .split("\n")[0]
      .slice(0, 140),
    NEXT_PUBLIC_BUILT_AT: new Date().toISOString(),
  },
};

export default nextConfig;
