import { defineConfig } from "drizzle-kit";

/**
 * Used only for `drizzle-kit generate` (schema diff -> SQL). Migrations are
 * applied programmatically via modules/core/data/migrate.ts (PGlite) — and via
 * the Neon connection in WP-04.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./modules/core/data/schema.ts",
  out: "./modules/core/data/migrations",
  strict: true,
  verbose: true,
});
