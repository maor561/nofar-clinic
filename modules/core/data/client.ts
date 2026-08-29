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
 */
export type Db = ReturnType<typeof drizzle<typeof schema>>;

function resolveDataDir(url: string | undefined): string {
  if (!url || url === "pglite") return "./.data/dev";
  if (url.startsWith("memory://")) return "memory://";
  if (url.startsWith("pglite://")) return url.slice("pglite://".length);
  throw new Error(
    `Unsupported DATABASE_URL "${url}". Postgres/Neon support lands in WP-04; use PGlite for now.`,
  );
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
