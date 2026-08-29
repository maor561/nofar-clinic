# modules/

Domain-oriented modules. See `docs/ARCHITECTURE.md` §3–4.

## Rules

1. A module exposes **only** its `index.ts` — typed service functions. Importing another
   module's internal path (`modules/x/internal/...`) is forbidden (lint-enforced from WP-03).
2. A module never writes to another module's tables — it calls that module's service.
3. Timeline events: the producing module calls `patientFile.recordEvent(...)`. No event bus.
4. Hard boundaries (with enforcement tests) exist around exactly two things:
   `core/authz` (the scoping guard) and `core/fields` (the flexible-field validator).
   Everything else is convention.
5. Touching patient data ⇒ the module must call `core/audit` and, where an event is
   produced, `patientFile.recordEvent(...)`. Not "done" without an isolation test.

## Layout per module

```
modules/<name>/
  index.ts        public service contract (typed functions only)
  schema.ts       Drizzle tables owned by this module (added in WP-04)
  internal/       implementation — do not import from outside
```

## Current state (WP-00)

All folders are stubs (`export {}`). Real implementation lands per the work packages
in `docs/WORK_PACKAGES.md`.
