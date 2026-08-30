# core/fields — Field Registry

Flexible fields for treatment sessions, plan versions, questionnaires and
(stage 2) metrics. ADR-004 / ADR-019.

## The single validator

`validateFieldValue(def, value)` is the only place a `field_value` is checked. It
compiles the definition's serial schema to Zod and parses. `setFieldValues` /
`getFieldValues` (internal/store) both call it — **on write and on read** — so a
tampered or stale JSONB row is caught, not trusted.

## Serial schema

`field_definition.schema` (JSONB, `NOT NULL`) is a plain descriptor:

```ts
{ type: "scale", min: 1, max: 10, required: true }
{ type: "select", options: ["...", "..."], multiple: true }
{ type: "number", min: 20, max: 400 }
```

`compileFieldSchema(descriptor)` -> Zod validator. A malformed descriptor throws
here — "no schema, no field".

## v1 definitions live in code

`FIELD_REGISTRY` (internal/registry). `assertRegistryValid()` compiles every
schema, checks key uniqueness, type/schema agreement, and ADR-004 rule 3
(`charted: true` requires a `chartedColumn` mapping). It runs in the test suite,
so a broken definition fails CI. `loadRegistryInto(db, therapistId)` upserts.
Reload after changes: `pnpm db:registry`.

No graphical form builder in v1 (ADR-004 rule 4).

## Rendering

`<FieldInput def={...} name={...} defaultValue={...} />` — basic control per type
(text / number / scale / boolean / select / date). Used by the session and
questionnaire screens (WP-13 / WP-18).
