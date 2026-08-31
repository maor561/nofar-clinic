import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e/**"],
    // argon2id hashing + a fresh PGlite per test are CPU-heavy; under full-suite
    // parallelism the auth suite occasionally brushes the 5s default. Give it
    // room and retry once so a scheduling hiccup never reds the build.
    testTimeout: 20000,
    hookTimeout: 30000,
    retry: 1,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
