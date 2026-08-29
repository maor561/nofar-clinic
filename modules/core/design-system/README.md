# core/design-system

The shared UI layer. Everything visual that both the therapist and patient sides
use comes from here — imported via `@/modules/core/design-system`, never from
`@/components/ui/*` directly.

## Layout

```
index.ts              public contract — re-exports primitives + composed
icon.tsx              Calm Wellness stroke icon set  <Icon name=... />
logo.tsx              נופר wordmark + leaf mark
shells/
  therapist-shell.tsx side rail (RTL) + main
  patient-shell.tsx   top nav + centered main
states/
  empty-state.tsx     every empty view says what to do next
  error-state.tsx     what went wrong + how to recover
  loading-state.tsx   skeletons shaped like the real content
```

`@/components/ui/*` holds the vendored shadcn/radix primitives (button, input,
card, dialog, sonner, ...). Treat them like `node_modules`: this module wraps and
re-exports them; app code does not touch them.

## Tokens

Defined in `app/globals.css`. shadcn semantic names (`--primary`, `--card`, ...)
are mapped onto the Calm Wellness palette; `--color-sage-*`, `--color-blush*`,
`--color-ink*` etc. are available as Tailwind utilities (`bg-sage-soft`,
`text-ink-soft`). Light only, on purpose (ADR-012).

## Demo

`/design` renders every token, component, shell and state — the WP-01 DoD surface.
