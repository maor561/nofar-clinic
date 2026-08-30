import { existsSync } from "node:fs";

/**
 * Load `.env.local` for standalone scripts (migrate / seed / drizzle-kit). Next.js
 * loads it on its own; `tsx` does not. No-op when the file is absent (PGlite dev).
 */
if (existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}
