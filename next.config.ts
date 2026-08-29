import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native / WASM-backed packages that must be require()d at runtime, not bundled.
  serverExternalPackages: ["@electric-sql/pglite", "@node-rs/argon2"],
};

export default nextConfig;
