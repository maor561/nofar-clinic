import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

/**
 * `drizzle-kit generate` diffs the schema -> SQL. `drizzle-kit migrate/push/studio`
 * connect via the direct (unpooled) URL. Runtime migrations still go through
 * modules/core/data/migrate.ts.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./modules/core/data/schema.ts",
  out: "./modules/core/data/migrations",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "postgres://unset",
  },
});
