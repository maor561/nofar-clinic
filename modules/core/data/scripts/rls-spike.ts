import "../load-env";
import postgres from "postgres";

/**
 * WP-04 RLS spike (ADR-009 -> ADR-017).
 *
 * Question: does `SET LOCAL` / `set_config(_, _, true)` survive Neon's
 * transaction-mode pooler (the `-pooler` host / PgBouncer), so that Postgres RLS
 * can be used as defence-in-depth behind the app-level scoping guard?
 *
 * Run: pnpm tsx modules/core/data/scripts/rls-spike.ts
 * Uses the POOLED DATABASE_URL on purpose — that is what the app runs on.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("postgres")) throw new Error("set DATABASE_URL (pooled) in .env.local");
  const pooled = url.includes("-pooler.");
  console.log(`connection: ${pooled ? "POOLED (PgBouncer / transaction mode)" : "direct"}\n`);

  const sql = postgres(url, { prepare: false, max: 3 });
  const results: Record<string, string> = {};

  try {
    // 1) SET LOCAL inside a transaction, read back in the same txn
    const [{ v: local }] = await sql.begin(async (tx) => {
      await tx`select set_config('app.tid', 'THERAPIST_A', true)`;
      return tx`select current_setting('app.tid', true) as v`;
    });
    results["SET LOCAL, read within same txn"] =
      local === "THERAPIST_A" ? "OK — value visible" : `FAIL — got ${JSON.stringify(local)}`;

    // 2) session-level set_config in one round-trip, read in a separate round-trip
    await sql`select set_config('app.tid', 'THERAPIST_B', false)`;
    const [{ v: sessionScoped }] = await sql`select current_setting('app.tid', true) as v`;
    results["session set_config, read in a later query"] =
      sessionScoped === "THERAPIST_B"
        ? "persisted (session pinned)"
        : `did NOT persist — got ${JSON.stringify(sessionScoped)} (expected on a txn pooler)`;

    // 3) RLS end-to-end on a throwaway table
    await sql`drop table if exists _rls_probe`;
    await sql`create table _rls_probe (tid text not null, note text not null)`;
    await sql`alter table _rls_probe enable row level security`;
    await sql`alter table _rls_probe force row level security`;
    await sql`create policy _rls_probe_scope on _rls_probe
             using (tid = current_setting('app.tid', true))`;
    await sql`insert into _rls_probe (tid, note) values ('THERAPIST_A','a-note'), ('THERAPIST_B','b-note')`;

    const scoped = await sql.begin(async (tx) => {
      await tx`select set_config('app.tid', 'THERAPIST_A', true)`;
      return tx`select tid, note from _rls_probe order by tid`;
    });
    results["RLS: rows visible with SET LOCAL scope"] =
      scoped.length === 1 && scoped[0].tid === "THERAPIST_A"
        ? "OK — only THERAPIST_A rows"
        : `UNEXPECTED — ${JSON.stringify(scoped)}`;

    const unscoped = await sql`select tid from _rls_probe`;
    results["RLS: rows visible with NO scope set"] =
      unscoped.length === 0 ? "OK — fails closed (0 rows)" : `LEAK — ${JSON.stringify(unscoped)}`;

    await sql`drop table _rls_probe`;
  } finally {
    await sql.end();
  }

  console.log("--- findings ---");
  for (const [k, v] of Object.entries(results)) console.log(`• ${k}\n    ${v}`);
  const rlsWorks =
    results["RLS: rows visible with SET LOCAL scope"]?.startsWith("OK") &&
    results["RLS: rows visible with NO scope set"]?.startsWith("OK");
  console.log(
    `\n=> RLS as defence-in-depth via "BEGIN; SET LOCAL app.tid=…; …; COMMIT": ${
      rlsWorks ? "VIABLE" : "NOT reliable — keep RLS secondary, guard carries the weight"
    }`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
