import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import type { Db } from "./client";

/**
 * Fresh in-memory Postgres (PGlite) with all migrations applied. Each test file
 * gets its own isolated instance — no shared global, no cross-test bleed.
 */
export async function createTestDb(): Promise<Db> {
  const db = drizzle({ client: new PGlite(), schema });
  await migrate(db, { migrationsFolder: "./modules/core/data/migrations" });
  return db as unknown as Db;
}
