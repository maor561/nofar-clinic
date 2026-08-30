# core/audit

Append-only audit trail. `docs/DATA_MODEL.md#audit_log`, ADR-018.

## Writing

- **Automatic** — every write through a scoped DB handle (`getTherapistDb()` /
  `getPatientDb()` from `core/authz`) emits `create` / `update` / `delete`. This
  is the "records every access to patient data" hook and it cannot be forgotten,
  because it lives inside the guard.
- **Explicit** — auth events and screen-level reads:

  ```ts
  import { audit } from "@/modules/core/audit/server";
  await audit("login", "user", { actor: { therapistId, userId, role } });
  await audit("view", "patient", { patientId, entityId: patientId });
  ```

`recordAudit` never throws into the caller — an audit failure is logged, not
propagated (fail-open; revisit at the security review / WP-21).

## Reading

`queryAudit(therapistId, { patientId?, action?, from?, to?, limit?, offset? })` —
always scoped to the therapist. Rendered at `/t/audit` with the three filters
(patient / action / date) the DoD asks for.

## Append-only

- The service exposes no update/delete path.
- Migration `0002` adds a `BEFORE UPDATE OR DELETE` trigger that `RAISE`s.
- `purgeOldAudit(cutoff)` (retention, not scheduled — WP-21) disables the trigger
  inside a transaction to prune. Retention: `AUDIT_RETENTION_DAYS` = 730.
