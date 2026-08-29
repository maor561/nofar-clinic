// core/data — DB access. v1 runs on PGlite (local + tests); Neon swap is WP-04.
export { getDb, schema, type Db } from "./client";
export { runMigrations } from "./migrate";
