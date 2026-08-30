# STATUS

**עודכן:** 2026-08-29

---

## מצב נוכחי

שלב **תשתית**. WP-D1 ✓ · WP-00 ✓ · WP-01 ✓ · WP-02 ✓ · **WP-03 ✓ (Scoping Guard)** · הפריסה חיה.
`core/authz` — ScopedDb מטופס בלי raw handle, lint חוסם עקיפה, 11 בדיקות בידוד ירוקות. **הבא: WP-04 — Data Layer + RLS spike (Neon).**

## קישורים

- GitHub: https://github.com/maor561/nofar-clinic
- Vercel: https://nofar-clinic.vercel.app · dashboard: https://vercel.com/maor561s-projects/nofar-clinic
- git↔Vercel מחובר, auto-deploy מ-`main`. **תיקון:** Framework Preset היה "Other" (הגיש `public/` סטטית → 404) → שונה ל-Next.js.
- הפריסה כרגע = עמודים סטטיים בלבד (`/`, `/design`). auth ידרוש DB — Neon ב-WP-04.

## מה נעשה

- אפיון פונקציונלי מלא נקלט (PROJECT_BRIEF).
- מועצת ביקורת (5 יועצים + peer review) — המלצות שולבו: חיתוך סקופ v1, guard כבקרה ראשית, RLS spike, 2FA למטפל ב-v1, מסמכים רזים, מדדים בעמודות אמיתיות.
- סקירת שוק (בינלאומי + ישראלי) — הצדקת בנייה מתועדת (ADR-011).
- החלטות UI/UX: Calm Wellness · Desktop-first · צפיפות מאוזנת · תהליך עיצוב-קודם (ADR-012).
- נוצרו: `CLAUDE.md`, `docs/{PROJECT_BRIEF,ARCHITECTURE,DATA_MODEL,DECISIONS,WORK_PACKAGES,STATUS}.md`.

## בעבודה

- **WP-04 — Data Layer + RLS spike** (הבא). להקים Postgres/Neon בפרויקט Vercel (פרנקפורט), להעביר את `client.ts` מ-PGlite ל-Neon,
  spike ל-`SET LOCAL`/`set_config` + RLS מול transaction-pooler, seed בפרודקשן, החלטה מתועדת אם RLS load-bearing או הגנה-בעומק.
  **דרוש מהלקוח:** יצירת ה-DB ב-Vercel + connection string / env.
- **דיוקי תוכן במוקאפים** — טראק מקביל מול הלקוח, לא חוסם.
- **TOTP enrollment UI** + change-password UI — נדחו למסך הגדרות (WP-20). הליבה + בדיקות קיימות.
- **מהירות בדיקות:** ~90ש' (migrate-per-test ב-PGlite). לשקול template DB משותף בהמשך.

## ✅ הושלם

- **WP-D1 — מוקאפים.** 8 מסכים ב-3 Artifacts, אושרו כיוונית. `docs/DESIGN_SYSTEM.md` נגזר.
  - מנה 1: https://claude.ai/code/artifact/48fdc224-9aff-4c5e-9936-f501e68f0702
  - מנה 2: https://claude.ai/code/artifact/b78e85f8-31cd-43f6-b5b2-966c824faec0
  - מנה 3: https://claude.ai/code/artifact/3ec905bb-68c9-4f60-93de-8ae37bfd63cf
  - מקור: `docs/mockups/wp-d1-batch{1,2,3}.html`
- **WP-00 — Scaffold + CI.** Next.js 16.3 (App Router, Turbopack) · React 19 · TS strict · Tailwind v4
  (tokens ב-`app/globals.css`) · `next/font` Assistant + Frank Ruhl Libre · Vitest + Testing Library (2 בדיקות) ·
  ESLint (next) + Prettier · `.github/workflows/ci.yml` (lint/format/typecheck/test/build) ·
  שלד `/modules` מלא (core + דומיין, stubs) · `lib/strings.ts` · `tests/isolation/`.
  **פתוח:** pnpm הותקן דרך `npm i -g` (corepack חסום בהרשאות ב-Program Files).
- **WP-01 — Design System.** ADR-014. shadcn/ui (`--base radix --rtl`) → tokens ממופים ל-Calm Wellness ב-`app/globals.css`, Light בלבד ·
  פרימיטיבים ב-`components/ui/*` (vendored), נחשפים דרך `modules/core/design-system/index.ts` = גבול הייבוא ·
  composed: `Icon` (סט stroke משלנו), `Logo`, `TherapistShell` (side rail RTL), `PatientShell` (top nav), `EmptyState`/`ErrorState`/`LoadingRows`/`LoadingCards` ·
  `app/providers.tsx` (Direction + Tooltip + Toaster) · `app/design/page.tsx` = דף ה-DoD (יסודות/רכיבים/shells/מצבים).
  DoD: כל הרכיבים והמצבים מרונדרים · שני ה-shells עומדים (נבדק בדפדפן, desktop + mobile) · typecheck/lint/format/test/build ירוקים.
  **הערת ניגודיות:** `ink-faint` (#9AA29B) על surface ≈ 2.4:1 — לשימוש בטקסט ≥16px bold / דקורטיבי בלבד, לא בטקסט גוף.
- **WP-02 שלב א' — Auth core.** ADR-015 (שכבה כתובה בבית במקום Auth.js). Drizzle + PGlite (`modules/core/data`), סכימת auth
  (`therapist`/`user`/`session`/`invite`/`password_reset`/`login_attempt`) + `patient` מינימלי, מיגרציה `0000_init` ·
  `modules/core/auth`: argon2id · sessions (opaque token, sha256 ב-DB, 7d + rotation) · נעילה 5/15דק' + חנק IP 15/15דק' ·
  TOTP (otpauth) · invite חד-פעמי 7d · reset חד-פעמי 1h (מבטל sessions) · `index.ts` = חוזה ציבורי ·
  scripts `db:generate`/`db:migrate`/`db:seed` (tsx) · seed = נופר + 2 מטופלים · הצפנת `totp_secret` at-rest → WP-21.
- **WP-02 שלב ב' — routes + מסכים.** `modules/core/auth/server.ts` (`import "server-only"`): cookie httpOnly/lax · `getCurrentSession` (עם rotation) ·
  `requireTherapist`/`requirePatient` (redirect `/login`) · `logout` · `requestContext` (ip/ua) · `getDisplayName` ·
  `middleware.ts` — gate גס: `/t*` `/p*` בלי cookie → `/login?next=` (edge, לא נוגע ב-DB) ·
  מסכי auth (design-system, RTL): `/login` (+שלב TOTP) · `/invite/[token]` (one-click) · `/forgot` · `/reset/[token]` · route groups `(auth)`/`(therapist)`/`(patient)` + placeholder dashboards ·
  `serverExternalPackages: [pglite, argon2]` ב-`next.config` (ה-bundler שבר את PGlite) · `DbNotConfiguredError` — auth על Vercel בלי DB מטופל בחן ולא קורס ·
  **19 בדיקות** (+2: display-name, invite→session) · **נבדק בדפדפן מקומית:** login מטפל→`/t` · logout→`/login` · invite→סיסמה→`/p` · middleware redirect. build + כל הבדיקות ירוקים.
- **WP-03 — Scoping Guard.** ADR-016. `modules/core/authz`: `internal/scoped-db.ts` (`TherapistDb`/`PatientDb` — raw handle ב-`protected` ללא accessor;
  כל פעולה מוסיפה `therapist_id`/`patient_id` ל-WHERE; `PatientDb.self()` לשורש; `scopeWhere` escape hatch) · `index.ts` `scopedDbFor` · `server.ts` `getTherapistDb`/`getPatientDb` ·
  טיפוסים דורשים עמודות scope (PatientDb לא יכול לנקוב בטבלה בלי `patient_id`) · **lint** `no-restricted-imports` חוסם `getDb`/`client` ב-app+domain (נבדק — נופל על bypass) ·
  טבלת `timeline_event` מינימלית (`patient-file/schema.ts`, מיגרציה `0001`) · **11 בדיקות בידוד** (`tests/isolation/patient-isolation.test.ts`) · `/p` דשבורד משתמש ב-`getPatientDb().self()` (הוכחה חיה) ·
  **30 בדיקות סה"כ** · build ירוק · נבדק בדפדפן: invite→`/p` עם שם מה-guard.

## מיתוג (מ-Instagram @nofar_naturopathy — ravpage/FB חסומים ב-Cloudflare)

- נופר כהן, נטורופתית, יקנעם. נישה: ירידה במשקל בלי ספירת קלוריות, לאמהות ונשים עסוקות. טון חם, נשי, מעודד — **לא קליני**.
- **צבע חתימה:** ירוק מרווה/אקליפטוס (רקע פרופיל + כל ה-Highlights). **אקסנט:** ורוד/רוז' רך (לבבות, כותרות בכתב יד). הרבה לבן, פינות רכות.
- מתיישב עם Calm Wellness (ADR-012). **פלטה זמנית:** primary `#5E7A66`/`#7C9885` · accent `#D99BA0` · רקע `#FAF8F4` · משטח `#FFF` · טקסט `#2E3A32`.
- **פתוח:** לוגו + צבעים מדויקים מנופר — יחדדו את WP-01.

## החלטות שהתקבלו בסשן 2026-08-29 (המשך)

- **git:** repo נפרד — אושר. `git init` ב-WP-00.
- **דוא"ל:** Resend — אושר (חינם עד 3,000/חודש, 100/יום; דומיין בהמשך).
- **ORM:** Drizzle — הוסבר ללקוח, ההמלצה בעינה, נעילה ב-WP-04.
- **Vercel + DB:** ללקוח יש חשבון Vercel; הגדרת פרויקט + DB תיעשה לפני WP-04.
- **אפליקציית ייחוס ל-UX:** אין. הדגש: UX חייב להיות מושלם בשני הצדדים.

## שאלות פתוחות

- **שמירת מידע:** 7 שנים רשומות / שנתיים Audit — לאישור ב-WP-21.
- **דומיין:** יסופק ע"י הלקוח לפני WP-07.
- **push ל-GitHub:** אין `gh` במכונה; ה-remote נוסף. ה-push הראשון דורש credentials של הלקוח (Git Credential Manager) — אם נכשל, הלקוח מריץ `git push` פעם אחת ידנית.

## יומן סשנים

### 2026-08-29 — תכנון ראשוני
אפיון נקלט · 24 שאלות דיוק (מסד/פלטפורמה/אימות/מודל מטפל/מיקום מידע/שדות דינמיים/GCal/התראות/שפה/2FA/אבטחה/UI-UX) ·
מועצת ביקורת הורצה · סקירת שוק · 13 ADR ננעלו · 6 מסמכי קונטקסט + CLAUDE.md נוצרו ·
הבא: מוקאפים (WP-D1). מיתוג: IG/FB של Nofar Naturopathy.

### 2026-08-29 — אישור התחלה + WP-D1
הלקוח ענה על 9 שאלות פתוחות (repo נפרד ✓ · Resend ✓ · Drizzle הוסבר · Vercel קיים · אין אפליקציית ייחוס, "UX מושלם" הוא הדגש) ·
מיתוג נמשך מ-Instagram (מרווה + רוז', חם/רגוע) — ravpage+FB חסומים ב-Cloudflare · פלטה זמנית נקבעה ·
הוצגה תוכנית ביצוע ליניארית מלאה (24 צעדים עד v1) · הלקוח אישר להתחיל ·
**WP-D1 — כל 8 המסכים הוגשו** ב-3 Artifacts (מקור ב-`docs/mockups/`), והלקוח אישר את הכיוון העיצובי ("מדהים"; תוכן יעודכן בהמשך).
נגזר `docs/DESIGN_SYSTEM.md` — פלטה מרווה/רוז' (זמנית) · Frank Ruhl Libre + Assistant · shell מטפל (side rail) מול shell מטופל (top nav) ·
תיק מטופל כ-hub סביב Timeline · מסך פגישה = זרימה רציפה אחת עם stepper דביק · מלאי רכיבים ל-WP-01.

### 2026-08-30 — WP-03 Scoping Guard
`core/authz` נבנה (ADR-016): `ScopedDb` (Therapist/Patient) מטופס, raw handle `protected` ללא accessor · `getTherapistDb`/`getPatientDb` ב-`server.ts` ·
טבלת `timeline_event` מינימלית + מיגרציה `0001` כטבלה שנייה ל-suite · lint `no-restricted-imports` חוסם `getDb` מחוץ ל-`core/{data,authz,auth}` (נבדק שנופל על bypass) ·
`DbNotConfiguredError` הועבר להיחשף מ-`authz` · 11 בדיקות בידוד ב-`tests/isolation/` · `/p` הומר ל-`getPatientDb().self()` · 30 בדיקות ירוקות · נבדק בדפדפן.
תיקון טיפוסים: `patient` (אין לו `patient_id` משלו) → `PatientDb.self()`; `InferInsertModel<T>` נמחק ל-`{}` בגנרי → `values: Record<string,unknown>`.

### 2026-08-30 — פריסת Vercel + WP-02 שלב ב'
**פריסה:** האתר החזיר 404 — Framework Preset ב-Vercel היה "Other" (הגיש `public/` סטטית; `/next.svg`→200, `/`→404).
הלקוח שינה ל-Next.js; קומיט לנעילת Node 22 אילץ build טרי → `nofar-clinic.vercel.app` חי (`/`, `/design`). (ניסיון ביניים: `next build --webpack` — נשאר, אבל לא זה היה הבאג.)
**WP-02ב':** `auth/server.ts` (cookie+guards+logout+context+displayName) · `middleware.ts` (gate edge) · מסכי login/invite/forgot/reset (design-system) · route groups + placeholder dashboards ·
`serverExternalPackages` תיקן `TypeError: path... Received URL` מ-PGlite תחת ה-bundler · `DbNotConfiguredError` ל-Vercel · +2 בדיקות (19) ·
נבדק בדפדפן: כל זרימות ה-auth עובדות מקומית מקצה לקצה.

### 2026-08-30 — WP-02 שלב א' (Auth core)
הלקוח בחר "התחל עכשיו מול DB מקומי, החלף ל-Neon בהמשך" ומסר קישורי GitHub + Vercel (`nofar-clinic`) ·
הוחלט לכתוב auth בבית במקום Auth.js (ADR-015) — Credentials של Auth.js כופה JWT, מתנגש עם sessions-ב-DB ·
נוספו deps: drizzle-orm, @electric-sql/pglite, @node-rs/argon2, otpauth, zod, nanoid, server-only, drizzle-kit, tsx ·
`modules/core/data` (client/schema-barrel/migrate/seed/testing) + `drizzle.config.ts` + מיגרציה `0000_init` (7 טבלאות) ·
`modules/core/auth` (schema + 8 קבצי internal + index) · argon2 `Algorithm` const-enum עקף עם `algorithm: 2` ·
בדיקות DB רצות ב-`// @vitest-environment node` (PGlite נשבר ב-jsdom) · `server-only` הוסר מ-modules כי שובר tsx/vitest ·
PGlite file-backed צריך `mkdirSync` ידני · migrate+seed עובדים מקומית · 17/17 בדיקות · build ירוק · ADR-014/015 ב-DECISIONS.

### 2026-08-30 — WP-01 Design System
shadcn init (`--base radix --rtl`, סגנון radix-nova) דרך `npx` (dlx שבור על zod) · `globals.css` נכתב מחדש: `@theme` Calm Wellness + מיפוי tokens סמנטיים של shadcn · `.dark` הוסר, `next-themes` הוסר מ-sonner ·
15 רכיבי shadcn נוספו (input/textarea/label/card/badge/table/checkbox/select/dialog/sonner/separator/avatar/skeleton/tabs/tooltip) + button מה-init ·
`modules/core/design-system/`: `icon.tsx` (סט מ-32 אייקוני stroke, פורט מהמוקאפים), `logo.tsx`, `shells/{therapist,patient}-shell.tsx`, `states/{empty,error,loading}-state.tsx`, `index.ts` (חוזה ציבורי), `README.md` ·
`app/providers.tsx` + חיווט ב-layout · `app/design/page.tsx` (4 טאבים) · home מפנה ל-`/design` ·
ADR-014 נכתב · build: 3 routes (/, /_not-found, /design) · נבדק בדפדפן ב-1440 ו-800 (side rail RTL תקין; מובייל = נאב אופקי) · console נקי (רק HMR ws של הפריוויו).
`git init` נפרד בתיקיית הפרויקט (יושבת בתוך repo `C:\cluade` — לא קשור). `create-next-app` (Next 16.3, App Router, Turbopack, TS, Tailwind v4, no-src) בתיקיית scratch ואז מוזג לשורש עם שמירת `CLAUDE.md`/`docs/` ·
`app/globals.css` = tokens של Calm Wellness (light-only) · `app/layout.tsx` = `lang=he dir=rtl` + `next/font` (Assistant + Frank Ruhl Libre) · `app/page.tsx` = דף בדיקת shell ·
שלד `/modules` (10 core + 9 דומיין, כל אחד `index.ts` stub + `internal/`) · `modules/README.md` · `lib/strings.ts` · `tests/isolation/README.md` ·
Vitest (jsdom + Testing Library + jest-dom) + 2 בדיקות · Prettier (`.prettierrc.json`, מתעלם מ-`docs`/`*.md`) · `.github/workflows/ci.yml` ·
`.claude/launch.json` לפריוויו · pnpm הותקן גלובלית (corepack חסום ב-Program Files) · `allowBuilds` ב-pnpm-workspace ל-esbuild/oxide/unrs-resolver ·
כל הבדיקות ירוקות: typecheck ✓ lint ✓ format ✓ test 2/2 ✓ build ✓ · `pnpm dev` נבדק בדפדפן — RTL + פונטים + פלטה תקינים, אפס שגיאות console ·
remote `origin` = github.com/maor561/nofar-clinic. הבא: WP-01.
