import { mkdirSync } from "node:fs";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * DB client.
 *
 * - `DATABASE_URL` = `postgres(ql)://…`  -> Neon Postgres via postgres.js (prod + local).
 * - `DATABASE_URL` = `memory://`         -> in-process PGlite (tests).
 * - `DATABASE_URL` = `pglite://<path>`   -> PGlite at a path.
 * - unset (local)                        -> file-backed PGlite at .data/dev.
 * - unset (Vercel)                       -> DbNotConfiguredError; auth degrades gracefully.
 *
 * The query surface is dialect-identical, so the app / guard / migrations don't
 * care which backend is live.
 */
export type Db = PostgresJsDatabase<typeof schema>;

export class DbNotConfiguredError extends Error {
  constructor() {
    super("no database configured (set DATABASE_URL)");
    this.name = "DbNotConfiguredError";
  }
}

/** The Postgres URL, whatever the Vercel integration named it. */
function postgresUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL_NON_POOLING,
  ];
  return candidates.find((u) => u?.startsWith("postgres://") || u?.startsWith("postgresql://"));
}

const globalForDb = globalThis as unknown as {
  __nofarDb?: Db;
  __nofarSql?: ReturnType<typeof postgres>;
};

/**
 * Build a postgres.js drizzle instance. `prepare: false` keeps it compatible with
 * Neon's transaction-mode pooler (the `-pooler` host).
 */
function makePostgres(url: string): Db {
  if (!globalForDb.__nofarSql) {
    globalForDb.__nofarSql = postgres(url, { prepare: false });
  }
  return drizzlePg({ client: globalForDb.__nofarSql, schema });
}

function makePglite(): Db {
  const url = process.env.DATABASE_URL;
  let dir: string;
  if (url?.startsWith("memory://")) dir = "memory://";
  else if (url?.startsWith("pglite://")) dir = url.slice("pglite://".length);
  else {
    if (process.env.VERCEL) throw new DbNotConfiguredError();
    dir = "./.data/dev";
  }
  if (dir !== "memory://") mkdirSync(dir, { recursive: true });
  // pglite's drizzle instance is a structural match for the postgres-js type.
  return drizzlePglite({ client: new PGlite(dir), schema }) as unknown as Db;
}

export function getDb(): Db {
  if (!globalForDb.__nofarDb) {
    const pg = postgresUrl();
    globalForDb.__nofarDb = pg ? makePostgres(pg) : makePglite();
  }
  return globalForDb.__nofarDb;
}

/**
 * Test-only seam. `createTestDb()` calls this so the `getDb()`-bound public
 * wrappers (core/fields, core/notifications, …) resolve to the per-test PGlite
 * instance instead of spinning up a stray one. Never called from app code.
 */
export function __setActiveDb(db: Db | undefined): void {
  globalForDb.__nofarDb = db;
}

export { schema };
