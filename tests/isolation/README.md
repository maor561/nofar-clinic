# tests/isolation/

Cross-tenant isolation suite — the executable definition of the critical
requirement (`CLAUDE.md` "כלל הזהב", `docs/ARCHITECTURE.md` §5).

For every endpoint and every id: a session for patient B hitting patient A's data
must get nothing back / 0 rows affected. Runs in CI and every session.
**No new patient-data endpoint without cases here.**

## Current coverage (WP-03)

`patient-isolation.test.ts` — the scoping guard (`modules/core/authz`) over two
tables, `patient` and `timeline_event`:

- `scopedDbFor` returns the right class per role; refuses a patient session with
  no `patient_id`.
- patient scope: `self()` yields only the own root row; `findMany` / `count` on
  `timeline_event` are filtered to the patient.
- patient scope writes: `update` / `delete` targeting another patient affect 0
  rows; `insert` forces the scope's `patient_id` / `therapist_id`, ignoring
  smuggled values.
- therapist scope: sees own patients only; can't update another therapist's
  patient.
- no-bypass: the scoped handle exposes no raw-DB accessor; a patient scope can't
  name a table lacking `patient_id` (type-level).

Grows with every domain module (WP-10+).
