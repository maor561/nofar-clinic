import "./load-env";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import postgres from "postgres";
import { getDb } from "./client";

const MIGRATIONS_DIR = "./modules/core/data/migrations";

/**
 * Apply all pending migrations. On Postgres this uses a direct (unpooled)
 * connection — DDL + the migrator's advisory lock don't play well through a
 * transaction-mode pooler.
 */
export async function runMigrations(): Promise<void> {
  const direct = process.env.DATABASE_URL_UNPOOLED;
  const url = process.env.DATABASE_URL;

  if (direct || url?.startsWith("postgres")) {
    const sql = postgres(direct ?? url!, { max: 1 });
    try {
      await migratePg(drizzlePg(sql), { migrationsFolder: MIGRATIONS_DIR });
    } finally {
      await sql.end();
    }
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await migratePglite(getDb() as any, { migrationsFolder: MIGRATIONS_DIR });
}

if (process.argv[1] && process.argv[1].endsWith("migrate.ts")) {
  runMigrations()
    .then(() => {
      console.log("migrations applied");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
