# נופר — מערכת ניהול מטפל–מטופל

מערכת Web לניהול הקשר הטיפולי בין מטפל יחיד למטופליו (נטורופתיה / רפלקסולוגיה / תזונה).
עברית RTL, Desktop-first, Light. פרטיות המטופל היא הדרישה הקריטית — ראה `CLAUDE.md`.

## סטאק

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (פלטת Calm Wellness) ·
Vitest + Testing Library · ESLint + Prettier · פריסה: Vercel · DB: Postgres/Neon (מ-WP-04).

## פיתוח

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint         # ESLint
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest
pnpm format       # Prettier --write
pnpm build        # next build
```

## מבנה

```
app/                 מסכים (App Router) — (therapist) ו-(patient) מ-WP-01
modules/core/*       תשתית: auth, authz (scoping guard), data, audit, fields, ...
modules/*            מודולי דומיין: patients, patient-file, sessions, ...
lib/                 עזרים (strings.ts = כל טקסט המשתמש)
tests/isolation/     חבילת בידוד cross-tenant (מ-WP-03) — הגדרת "גמור" לדרישה הקריטית
docs/                מסמכי קונטקסט + מוקאפים
```

תיעוד מלא: `docs/STATUS.md` (התחל כאן), `docs/ARCHITECTURE.md`, `docs/WORK_PACKAGES.md`,
`docs/OPERATIONS.md` (רגולציה, גיבוי, incident response, checklist פרודקשן).

## פריסה ותפעול

- **פריסה:** git↔Vercel, auto-deploy מ-`main`. Framework Preset = Next.js.
- **מיגרציות:** `pnpm db:migrate` (דרך `DATABASE_URL_UNPOOLED`). `pnpm db:registry` לטעינת Field Registry.
- **חותמת גרסה:** `GET /api/version` מחזיר את ה-SHA שנפרס — להשוואה מול הקומיט האחרון ב-`main`.
- **סביבה:** `.env.local` (gitignored) — `DATABASE_URL(_UNPOOLED)`, `RESEND_API_KEY`, `EMAIL_FROM`,
  `APP_URL`, `BLOB_READ_WRITE_TOKEN`. ב-Vercel מוגדרים דרך Project Settings / אינטגרציות.
- **גיבוי / שחזור / אירוע אבטחה / רגולציה:** `docs/OPERATIONS.md`.
