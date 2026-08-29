# STATUS

**עודכן:** 2026-08-29

---

## מצב נוכחי

שלב **תשתית**. WP-D1 ✓ · WP-00 ✓ · WP-01 ✓ · **WP-02 שלב א' ✓** —
ליבת auth כתובה בבית (ADR-015): argon2id, sessions ב-DB (opaque token), נעילה + חנק IP, TOTP, הזמנה, איפוס.
Drizzle + PGlite מקומית. 17 בדיקות ירוקות. **הבא: WP-02 שלב ב'** — routes + middleware + מסכים.

## קישורים

- GitHub: https://github.com/maor561/nofar-clinic
- Vercel: https://vercel.com/maor561s-projects/nofar-clinic (חיבור בפועל — ב-WP-04/פריסה)

## מה נעשה

- אפיון פונקציונלי מלא נקלט (PROJECT_BRIEF).
- מועצת ביקורת (5 יועצים + peer review) — המלצות שולבו: חיתוך סקופ v1, guard כבקרה ראשית, RLS spike, 2FA למטפל ב-v1, מסמכים רזים, מדדים בעמודות אמיתיות.
- סקירת שוק (בינלאומי + ישראלי) — הצדקת בנייה מתועדת (ADR-011).
- החלטות UI/UX: Calm Wellness · Desktop-first · צפיפות מאוזנת · תהליך עיצוב-קודם (ADR-012).
- נוצרו: `CLAUDE.md`, `docs/{PROJECT_BRIEF,ARCHITECTURE,DATA_MODEL,DECISIONS,WORK_PACKAGES,STATUS}.md`.

## בעבודה

- **WP-02 שלב ב'** (הבא): route handlers / server actions, middleware → request context (תפר ה-guard),
  מסכי התחברות/הזמנה/איפוס/TOTP מהמוקאפים, `import "server-only"` בשכבת ה-routes.
- **דיוקי תוכן במוקאפים** — טראק מקביל מול הלקוח, לא חוסם.
- **DB פרודקשן:** Neon בפרויקט Vercel — יוקם ב-WP-04 (או קודם, לפי הצורך). כרגע PGlite מקומית.

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
  scripts `db:generate`/`db:migrate`/`db:seed` (tsx) · seed = נופר + 2 מטופלים · **17 בדיקות** (`auth.test.ts`, env=node) ·
  כל הבדיקות ירוקות. **פתוח:** `server-only` הוסר זמנית מ-modules (שובר tsx/vitest) — יוחזר בשכבת ה-routes ב-WP-02ב'; הצפנת `totp_secret` at-rest → WP-21.

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
