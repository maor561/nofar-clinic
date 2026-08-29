import { mkdirSync } from "node:fs";
import { drizzle } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "./schema";

/**
 * DB client.
 *
 * v1 local dev + tests run on PGlite (in-process Postgres, no install). The
 * production swap to Neon Postgres (WP-04) replaces only this file — schema,
 * queries and migrations are dialect-identical.
 *
 * `DATABASE_URL`:
 *   - unset / "pglite"      -> file-backed PGlite at .data/dev  (local dev)
 *   - "memory://"           -> in-memory PGlite                  (tests)
 *   - "postgres://..."      -> reserved for WP-04 (throws for now)
 *
 * On Vercel there is no writable persistent FS, so PGlite is refused with a
 * typed error the auth layer catches — the deployed preview simply has no DB
 * until Neon is wired in WP-04.
 */
export type Db = ReturnType<typeof drizzle<typeof schema>>;

export class DbNotConfiguredError extends Error {
  constructor() {
    super("no database configured (set DATABASE_URL — Neon lands in WP-04)");
    this.name = "DbNotConfiguredError";
  }
}

function resolveDataDir(url: string | undefined): string {
  if (url && (url.startsWith("postgres://") || url.startsWith("postgresql://"))) {
    throw new Error("Postgres/Neon support lands in WP-04; unset DATABASE_URL to use PGlite.");
  }
  if (url?.startsWith("memory://")) return "memory://";
  if (url?.startsWith("pglite://")) return url.slice("pglite://".length);
  if (process.env.VERCEL) throw new DbNotConfiguredError();
  return "./.data/dev";
}

const globalForDb = globalThis as unknown as { __nofarDb?: Db };

export function getDb(): Db {
  if (!globalForDb.__nofarDb) {
    const dir = resolveDataDir(process.env.DATABASE_URL);
    if (dir !== "memory://") mkdirSync(dir, { recursive: true });
    globalForDb.__nofarDb = drizzle({ client: new PGlite(dir), schema });
  }
  return globalForDb.__nofarDb;
}

export { schema };
