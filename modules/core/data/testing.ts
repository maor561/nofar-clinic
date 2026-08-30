import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";
import { __setActiveDb, type Db } from "./client";

/**
 * Fresh in-memory Postgres (PGlite) with all migrations applied. Each test file
 * gets its own isolated instance — no shared global, no cross-test bleed. Also
 * points `getDb()` at this instance so the `getDb()`-bound public wrappers
 * (core/fields, core/notifications, …) work under test.
 */
export async function createTestDb(): Promise<Db> {
  const db = drizzle({ client: new PGlite(), schema });
  await migrate(db, { migrationsFolder: "./modules/core/data/migrations" });
  const typed = db as unknown as Db;
  __setActiveDb(typed);
  return typed;
}
