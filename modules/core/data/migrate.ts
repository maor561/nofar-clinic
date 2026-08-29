import { migrate } from "drizzle-orm/pglite/migrator";
import { getDb } from "./client";

const MIGRATIONS_DIR = "./modules/core/data/migrations";

/** Apply all pending migrations to the current DB. Idempotent. */
export async function runMigrations(): Promise<void> {
  await migrate(getDb(), { migrationsFolder: MIGRATIONS_DIR });
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
