# core/authz — the scoping guard

The single enforcement point for the critical requirement: **no code obtains DB
access without a tenant scope** (`CLAUDE.md` "כלל הזהב", `docs/ARCHITECTURE.md` §5,
ADR-016).

## How to get a DB handle

```ts
import { getTherapistDb, getPatientDb } from "@/modules/core/authz/server";

const tdb = await getTherapistDb(); // redirects to /login if not a therapist
const pdb = await getPatientDb();   // redirects to /login if not a patient
```

`getTherapistDb()` resolves the request session, enforces the role, and returns a
`TherapistDb`; `getPatientDb()` returns a `PatientDb`. Both are bound to the
caller's scope. There is **no** sanctioned path to the raw client from app or
domain code — `import "@/modules/core/data/client"` is lint-banned outside
`core/{data,authz,auth}` (`eslint.config.mjs`).

## What a scoped handle does

Every operation is AND-ed with the scope predicate:

| method | therapist scope | patient scope |
|--------|-----------------|---------------|
| `findMany` / `findOne` / `count` | `WHERE therapist_id = <me>` | `WHERE therapist_id = <me> AND patient_id = <me>` |
| `insert` | forces `therapist_id = <me>` | forces `therapist_id` + `patient_id` |
| `update` / `delete` | scoped `WHERE` | scoped `WHERE` |
| `self()` (patient only) | — | the patient's own `patient` root row |
| `scopeWhere(table, extra?)` | the predicate, for hand-built queries | same |

A table must carry the scope columns or it won't typecheck: a `PatientDb` cannot
even name a therapist-only table. The raw Drizzle handle lives in a `protected`
field with no accessor.

## Rules for domain modules

- A domain service function takes a `TherapistDb` / `PatientDb` (or `ScopedDb`) —
  it can't run without a scope.
- New patient-data reads/writes get cases in `tests/isolation/`. No exceptions.
- Need a join or aggregate the primitives don't cover? Build it on
  `scopeWhere(table)` and add the isolation cases for it.

## Deferred

- Postgres RLS as defence-in-depth — WP-04 spike (ADR-009). Until then the guard
  is load-bearing on its own.
