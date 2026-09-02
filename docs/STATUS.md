# STATUS

**עודכן:** 2026-09-02

---

## מצב נוכחי

שלב **סגירה** + דיוקי מוצר לפי שימוש של הלקוח. **WP-00..22 ✓ · WP-23 קוד ✓** (Blob EU = פעולת לקוח).
**133 בדיקות ירוקות**, הפריסה חיה, פונקציות רצות ב-`fra1`.
**מודול ההודעות (WP-16) מוסתר** מאחורי `lib/features.ts` (`messaging: false`) — קוד נשמר, ניווט+מסלולים כבויים (ADR-038).
**היומן — חלק א׳ (WP-28 + WP-29 ✓):** זמינות מטפלת (`/t/settings/availability`) + מנוע חלונות טהור + קביעת תור עצמית למטופל (`/p/appointments/new`, אישור אוטומטי). `SchedulingView` ב-`core/authz` (ADR-040). נבדק מקצה לקצה מול Neon. מיגרציה `0013`.
**היומן — חלק ב׳ (WP-32, Google Calendar ✓ קוד + חי):** מודול `calendar-sync` — דחיפה Nofar→Google (best-effort, `void`), free/busy למנוע החלונות + לאג'נדת המטפלת (`/t/calendar` מציג בלוקים חסומים מ-Google לצד הפגישות, עם דה-דופ), טוקן refresh מוצפן AES-256-GCM (`0014`), מסלולי OAuth, כרטיס `/t/settings`. ADR-041.
**✅ הלקוחה חיברה את Google Calendar בהצלחה (2026-09-01)** — env הוזן ב-Vercel, אומת מול נתונים אמיתיים. **נותר (לא חוסם):** Publish App ב-Google Cloud כדי שהחיבור לא יתנתק כל 7 ימים (מצב Testing).
**הבא: חיבור Google חי (לקוח) · WP-24..27 (לא חוסמי v1).**

## קישורים

- GitHub: https://github.com/maor561/nofar-clinic
- Vercel: https://nofar-clinic.vercel.app · dashboard: https://vercel.com/maor561s-projects/nofar-clinic
- git↔Vercel מחובר, auto-deploy מ-`main`. Framework Preset = Next.js. Neon + Resend מחוברים ל-env.
- **חותמת גרסה:** `GET /api/version` מחזיר `sha`/`shortSha`/`ref`/`builtAt` (מ-`VERCEL_GIT_COMMIT_SHA`). גם בכותרת התחתונה של `/`. להשוואה מול הקומיט האחרון ב-`main` = "האם הדחיפה עלתה".

## מה נעשה

- אפיון פונקציונלי מלא נקלט (PROJECT_BRIEF).
- מועצת ביקורת (5 יועצים + peer review) — המלצות שולבו: חיתוך סקופ v1, guard כבקרה ראשית, RLS spike, 2FA למטפל ב-v1, מסמכים רזים, מדדים בעמודות אמיתיות.
- סקירת שוק (בינלאומי + ישראלי) — הצדקת בנייה מתועדת (ADR-011).
- החלטות UI/UX: Calm Wellness · Desktop-first · צפיפות מאוזנת · תהליך עיצוב-קודם (ADR-012).
- נוצרו: `CLAUDE.md`, `docs/{PROJECT_BRIEF,ARCHITECTURE,DATA_MODEL,DECISIONS,WORK_PACKAGES,STATUS}.md`.

## בעבודה

- **WP-23 — מיקום מידע EU** 🟡 — פונקציות נכפו ל-`fra1` ב-`vercel.json` (היו `iad1`). DB+compute ב-EU. **Blob store EU = פעולת לקוח** (אזור נקבע ביצירה); עד אז הסכמת `data_transfer_abroad`. Vercel `fra1` + אזור EU ל-Blob (או S3 פרנקפורט) + גיבוי Blob.
- **WP-24..27** — הצפנת `totp_secret` at-rest · retention cron · anonymize+lock · `pg_dump` שבועי (לא חוסמי v1).
- **WP-22 — סקירת בידוד סופית** ✓ — אפס ממצאים ניתנים לניצול. 2 פערי הגנה-בעומק (`field_value` scoping, אימות patient ב-`create*`) נסגרו. probes חיים: כל `/t/*` → redirect, `/api/documents/<זר>` → 404. ADR-034.
- **WP-21 — נספח רגולציה ותפעול** ✓ — `docs/OPERATIONS.md`. תיקון 13: רישום ברשם בוטל; חובת ניהול/אבטחה רובה מיושמת; DPO כנראה לא נדרש (אישור עו"ד). פערי-קוד → WP-23..27. **ממתין לאישור הלקוח.**
- **WP-20 — Therapist Dashboard** ✓ — `/t` tiles חיים + לוח היום + משימות + טבלת מטופלים אחרונים. מולאו `/t/documents` ו-`/t/settings` (stub).
- **WP-19 — Patient App Shell + Dashboard** ✓ — דשבורד `/p` (פגישה הבאה / משימות / עדכונים / באנר שאלון) + `/p/profile` (קריאה) + nav מלא (8). responsive נבדק.
- **WP-18 — Questionnaire** ✓ — `questionnaire_response` (מיגרציה 0012) + תשובות ב-`field_value` (8 שאלות ב-Registry); `/p/questionnaire` (טופס→קריאה, re-submit) + `/t/patients/[id]/questionnaire`; timeline + התראה.
- **WP-08 Files + WP-17 Documents** ✓ — `@vercel/blob` private בלבד, נגיש רק דרך `/api/documents/[id]` scoped; `visibility` (`therapist_only`/`therapist_and_patient`) נאכף בכל קריאה של מטופל; מסכים `/t/patients/[id]/documents` + `/p/documents`. round-trip אמיתי אומת על ה-deploy החי (העלאה→הורדה→404 למטופל זר). מקומית אפשר להוסיף `BLOB_READ_WRITE_TOKEN` ל-`.env.local` לבדיקות מקומיות.
- **WP-16 — Messaging** ✓ **(מוסתר מ-2026-08-31, ADR-038)** — `message_thread`/`message` (מיגרציה 0010, dual-scoped); polling ב-`router.refresh()`; `/t/messages` תיבה + `/p/messages`. הדגל `lib/features.ts` `messaging: false` מסתיר ניווט + אריח דשבורד, המסלולים מחזירים 404. `messaging: true` מחזיר.
- **WP-15 — Tasks** ✓ — `task` dual-scoped (מיגרציה 0009); `setTaskStatus` לשני התפקידים; `task_created`/`task_completed` ל-Timeline; `/p/tasks`.
- **WP-14 — Treatment Plans** ✓ — `treatment_plan_version` append-only (מיגרציה 0008); תוכן דרך Field Registry; `/p/plan`.
- **WP-13 — Treatment Sessions** ✓ — `treatment_session` (מיגרציה 0007) + מסך "זרימה אחת". שלב "משימות" מהזרימה — יחווט ב-WP-15.
- **WP-12 — Appointments** ✓ — יומן שבועי (agenda) + CRUD + סטטוסים + `/p/appointments` לקריאה. `lib/tz.ts` שעון-קיר `Asia/Jerusalem`.
- **WP-11 — Patient File + Timeline** ✓ — `listTimeline`/`countTimeline` (scoped, סינון בשאילתה) + כרטיס ציר זמן במסך התיק.
- **WP-08 — File Storage** (Vercel Blob). פעולה קטנה מהלקוח: יצירת Blob store ב-Vercel → `BLOB_READ_WRITE_TOKEN` מוזרק אוטומטית.
- **מיתוג:** הלקוח שלח לוגו (עיגול מרווה + פרח לבן, כותרת "נופר כהן נטורופתית N.D והרבליסטית קלינית Cl.H"). לדגום ירוק מהלוגו + לעדכן subtitle. **הלקוח ביקש להתעלם מבקשות נוספות עד הודעה חדשה.**
- **דיוקי תוכן במוקאפים** — טראק מקביל, לא חוסם.
- **TOTP enrollment UI + change-password UI** ✓ — `/t/settings` (ADR-036). recovery codes = שיפור עתידי.
- **audit של קריאות** — `audit("view", "patient", ...)` ייווסף בתיק המטופל (WP-11).

## פעולות פתוחות ללקוח

- **לאפס סיסמת Neon + API key של Resend** (שניהם הודבקו בצ'אט) → לעדכן `.env.local` + Vercel env.
- **Vercel env:** להוסיף `RESEND_API_KEY`, `EMAIL_FROM=נופר כהן <nofar@nofar-health.com>`, `APP_URL=https://nofar-clinic.vercel.app`.
- **Vercel env — Web Push (WP-65):** `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY` (להריץ פעם: `node -e "console.log(require('web-push').generateVAPIDKeys())"`), `WEB_PUSH_SUBJECT=mailto:...`. עד אז ה-Push לא פעיל (השאר עובד).
- **לוודא ש-Neon מחובר לפרויקט Vercel** (Settings → Environment Variables).
- **למחוק את ה-MongoDB** שנוצר בטעות.

## פעולות פתוחות ללקוח

- **לאפס סיסמת Neon** — הודבקה בצ'אט. Neon → Roles → `neondb_owner` → Reset password → לעדכן `.env.local` + Vercel env.
- **לוודא ש-Neon מחובר לפרויקט Vercel** — Settings → Environment Variables: אמורים להופיע `DATABASE_URL` וכו' מהאינטגרציה. אם לא — Storage → הבסיס → Connect Project.
- **למחוק את ה-MongoDB** שנוצר בטעות (Storage → NOFAR-CLINIC → Delete).

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

- **שמירת מידע:** 7 שנים רשומות / שנתיים Audit — מדיניות אושרה עקרונית ב-WP-21 (`docs/OPERATIONS.md` §6); מימוש cron/anonymize → WP-25/WP-26.
- **דומיין:** יסופק ע"י הלקוח לפני WP-07.
- **push ל-GitHub:** אין `gh` במכונה; ה-remote נוסף. ה-push הראשון דורש credentials של הלקוח (Git Credential Manager) — אם נכשל, הלקוח מריץ `git push` פעם אחת ידנית.

## יומן סשנים

### 2026-09-02 (המשך ט') — WP-69: יומן אכילה + עוד דיוקי UI
`food_log_day` (מיגרציה `0024`) — יומן משותף: 5 ארוחות טקסט + הערת מטופל + הערת משוב מהמטפלת (ADR-050). **לא חישוב מאקרו** — המטפלת קוראת ומגיבה, ומדייקת דרך משימות/תוכנית. `/p/food` (ניווט ימים + סטטיסטיקה X/7) · `/t/patients/[id]/food` (משוב + קישורים למשימה/תוכנית). אירוע `food_log` + התראות דו-כיווניות. במובייל "אוכל" נכנס לסרגל התחתון במקום "שאלונים". 4 בדיקות בידוד (174 סה"כ). אומת מקצה-לקצה. **דיוקים באותו סבב:** באג 500 בשאלונים (בחירה שנשמרה כמספר) — coercion + קריאה סלחנית · פונט כותרות → Rubik · לחיצה על הלוגו חוזרת ל-`/p` · יציאה ירדה מהסרגל העליון במובייל · ברכה תלוית-שעה בדשבורד המטפלת · הסכמות ירדו מהקמת מטופל חדש.

### 2026-09-02 (המשך ח') — WP-68: UX מובייל למטופל + onboarding
**ADR-049.** צד המטופל במובייל (`< md`) עבר ל-shell כמו אפליקציה: סרגל עליון דק (לוגו + פעמון + יציאה) + **סרגל ניווט תחתון קבוע** (בית · פגישות · משימות · שאלונים · עוד, עם `safe-area`), "עוד" = sheet מלמטה עם שאר המסכים + מתג Push + יציאה. דסקטופ (`>= md`) ללא שינוי. **`PatientOnboarding`** — sheet בכניסה ראשונה פר-מכשיר (`localStorage`): הוספה למסך הבית (טקסט לפי פלטפורמה) + הפעלת התראות inline. `modules/core/push/subscribe.ts` חולץ (enablePush/disablePush/currentPushStatus/devicePlatform/isStandalone), משמש גם את הטוגל. תווית "שאלון קליטה" → "השאלונים שלי". פורטרט בלבד. 169 בדיקות ✓ · build ✓. אומת בדפדפן ב-375 וב-1100.

### 2026-09-02 (המשך ז') — WP-67: מאגר שאלונים + שיוך מרובה
`questionnaire_template` (מיגרציה `0023`) — מאגר שאלונים פר-מטפלת. שאלות = `field_definition` עם `template_id` (עדיין דרך ה-validator היחיד). `questionnaire_response` = שורה פר (מטופל, template); שורה ישנה `template_id=NULL` = שאלון הקליטה הגנרי, נשמר. מטא-דאטה של template נקראת גולמית ב-`internal/template-config.ts` (קונפיג מטפלת, לא מידע מטופל); תשובות תמיד guard-scoped. מסכים: `/t/settings/questionnaires` (+`[id]` CRUD שאלות), טופס מטופל → צ'ק-בוקס "שאלונים לשליחה", `/p/questionnaire` רשימה + `[rid]` מילוי. **`pnpm db:questionnaires`** זרע את 3 השאלונים של נופר (נטורופתי 17ש׳ / רפלקסולוגיה 9ש׳ / הסכם טיפולי 10ש׳) על Neon. **"גיל" → `date` "תאריך לידה"**. 9 בדיקות בידוד (169 סה"כ) · build ✓. אומת בדפדפן מקצה-לקצה: 3 templates במאגר, שיוך 2 שאלונים למטופל בהקמה/עריכה → הופיעו ברשימת המטופל, שאלון הקליטה הישן נשמר. ADR-048. **מכסה את דיוק השאלון של #3/WP-62** (נוסח מסמך הסכמה עצמאי עדיין פתוח).

### 2026-09-02 (המשך ו') — כמה חלונות זמינות ליום + הסבר Web Push
**חלונות מרובים (ADR-047):** מיגרציה `0022` הסירה את האילוץ unique על `(therapist_id, weekday)` ב-`availability_rule`. `normalizeRules` דוחה חפיפה במקום `weekday` כפול. מסך `/t/settings/availability` — `DayRow` client עם "+ הוספת חלון שעות" / "הסרת חלון". מנוע ה-slots כבר תמך. +3 בדיקות (166 סה"כ). אומת בדפדפן: ראשון 10:00–14:00 + 16:00–20:00 → שמירה → רענון → נשמר.
**Web Push:** הוסבר ללקוח מה זה ומה נדרש — 4 שלבים: (1) `node -e "console.log(require('web-push').generateVAPIDKeys())"`, (2) 3 env vars ב-Vercel (`WEB_PUSH_VAPID_PUBLIC_KEY`/`_PRIVATE_KEY`/`_SUBJECT`), (3) Redeploy, (4) הפעלה במכשיר + הערת אייפון ("הוסף למסך הבית" קודם). הפעמון והמיילים עובדים כרגיל בינתיים.

### 2026-09-02 (המשך ה') — WP-66: מחיקת מטופל קשה ובלתי-הפיכה
`deletePatientCompletely(tdb, id)` ב-`modules/patients` — מוחק blobs של מסמכים → `tdb.delete(patient)` יחיד scoped. מיגרציה `0021` הוסיפה `ON DELETE CASCADE` ל-`field_value`/`invite`/`user` → גורר login → session/notification/push. `audit_log` נשמר בכוונה (append-only, מטא-דאטה בלבד). UI: כרטיס "אזור מסוכן" ב-`/t/patients/[id]/edit` (checkbox + הקלדת שם). **ADR-046 — עוקף במפורש את המלצת anonymize+lock ב-OPERATIONS.md, באחריות הלקוחה, עם המלצה מוצגת להיוועץ בעו״ד.** 3 בדיקות בידוד (0 שורות בכל טבלה, tenant שני שלם). **סיום 17 הדיוקים של ROADMAP_V2** (חוץ מ-WP-62 שחסום על חומר מהלקוחה).

### 2026-09-02 (המשך ד') — WP-65: PWA + Web Push ברקע
PWA: `app/manifest.ts` (standalone, RTL, theme sage, אייקונים 192/512/maskable), SW `public/sw.js` (push + click) נרשם ב-layout. Web Push: מודול `modules/core/push` (טבלה `push_subscription` מיגרציה `0020`, `web-push`+VAPID), מחווט ל-`notify()` — כל התראה נשלחת גם כ-Push. מסלולי `/api/push/*`, `<PushToggle>` ב-`/t/settings` + `/p/profile` (מתדרדר בחן). 5 בדיקות בידוד (160 סה"כ). אומת: manifest + vapid endpoint + SW activated. **חסם לקוח:** VAPID keys ב-Vercel env. **הבא: WP-66** (מחיקת מטופל בלתי-הפיכה — צריך ADR שמתעד עקיפת anonymize+lock + המלצה להיוועץ עו"ד).

### 2026-09-02 (המשך ג') — WP-64: מחיקת מסמכים אחרי שנה + לולאת אישור
עמודה `document.retention_defer_until` (מיגרציה `0019`, הוחל על Neon). קבוצת בדיקה = בן >שנה + לא נדחה. מסך `/t/documents/review` (שמירה=+90d / מחיקה=row+blob+audit). **ללא cron** (ADR-044 — מטפל יחיד): `countRetentionReview(tdb)` → באנר אזהרה ב-`/t` וב-`/t/documents`. שום סוג לא מוחרג — כל מחיקה ידנית. 3 בדיקות בידוד. **הבא: WP-65** (PWA + Web Push — צריך VAPID keys) ו-WP-66 (מחיקת מטופל בלתי הפיכה — צריך ADR).

### 2026-09-02 (המשך ב') — WP-63: שליחת מסמך למספר מטופלים
`/t/documents` → כרטיס "שליחת מסמך למספר מטופלים" (קובץ + סוג + צ'ק-ליסט מטופלים מסונן). `shareDocumentWithPatients` יוצר רשומת `document` נפרדת + אירוע + התראת `document_shared` לכל מטופל, **עם עותק blob פר-מטופל** (ADR-043 — עצמאות מלאה למחיקה/גישה, קשור ל-WP-64). `patientId` זר מבטל את כל האצווה לפני כתיבה. +2 בדיקות בידוד (152 סה"כ) · build ✓. אומת: הטופס מציג את כל המטופלים הפעילים; נתיב ה-blob זהה להעלאה הבודדת המוכחת. **הבא: WP-64** (מחיקת מסמכים אוטומטית אחרי שנה + לולאת אישור).

### 2026-09-02 (המשך) — WP-61: סיכום מפגש למטופל
שדה `treatment_session.patient_summary` (מיגרציה `0018`, הוחל על Neon) — היחיד מהמפגש שהמטופל רואה. קטע 4 בזרימת המפגש → בשמירה עם תוכן: התראה+מייל `session_summary` + `/p/sessions` (מסך + ניווט "המפגשים שלי", `listSharedSummaries` patient-scoped). `updateSession` שולח שוב רק כשהטקסט משתנה. אומת מקצה-לקצה בדפדפן (מטפלת→מטופל, ללא דליפה בין מטופלים). 150 בדיקות ✓ · build ✓. קומיט `e78ea34`. **הבא: WP-63** (שליחת מסמכים למספר מטופלים).

### 2026-09-02 — ROADMAP_V2 שלב 3–4: סדרות טיפול + מדדים דינמיים
המשך רשימת ה-17 דיוקים לפי `docs/ROADMAP_V2.md`. **WP-57/58/59** (אשכול הסדרות, קומיט `6ffd13d`, CI ✓): כרטיס התקדמות סדרה בדשבורד המטופל · `seriesBookableLeft` חוסם קביעה עצמית מעבר למכסה (3 מקומות) · `setStatusAction` שולח למטופל התראה+מייל ב-`series_completed` / `series_ending` (≤2 נותרו), עם `markSeriesEndingNotified` נגד כפילות. **WP-60 · ADR-042** (🔑): מסך `/t/settings/fields` — "מדדי מפגש" מנוהלים מההגדרות. `modules/core/fields/internal/manage.ts` מרכיב `schema` סריאלי מקלטי טופס ומריץ `compileFieldSchema` לפני כל כתיבה (הגבול היחיד נשמר). סוג+schema ננעלים עם היצירה · אין `table`/`charted` דרך UI · שדות מובנים מסומנים · ▲▼ למיון. אומת מקצה-לקצה: מדד שנוסף בהגדרות הופיע אוטומטית בטופס תיעוד המפגש. 148 בדיקות ✓ · build ✓. **הבא: WP-61** (סיכום מפגש למטופל).

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

### 2026-09-01 — Google Calendar חי + בלוקים ביומן המטפלת
הלקוחה השלימה את הצד שלה: scopes ב-Data Access, Test user, OAuth client עם שתי כתובות ה-redirect, env ב-Vercel (`GOOGLE_OAUTH_CLIENT_ID`/`_SECRET`/`CALENDAR_TOKEN_KEY`) + Redeploy. תקלה בדרך: ניסתה קודם ליצור **Service account** (לא מתאים — עוקף הסכמת משתמש, לא עובד עם Gmail אישי) — כוונתי אותה ל-**OAuth client ID**. שגיאת `access_denied: 403` כי החשבון שהתחברה איתו לא היה ב-Test users — נוסף, ואז עברה את מסך "Google לא אימתה" (צפוי במצב Testing). **חיבור הצליח.**
הוסבר ללקוחה: הניתוק כל 7 ימים הוא תוצר של מצב Testing בלבד (לא של "לא מאומת") — הפתרון: Google Auth Platform → Audience → **Publish App**. לא חוסם, לא בוצע עדיין.
**בקשה נוספת:** בלוקים חסומים מ-Google יוצגו גם באג'נדה של המטפלת, לא רק במסך הקביעה של המטופל. הוספתי ל-`/t/calendar`: `googleBusy` נשלף במקביל ל-`listAppointments`, ממוזג עם הפגישות הפנימיות ליחידת `DayItem` אחת ממוינת לפי שעה; פריט Google מוצג כשורה מוחשכת + אייקון מנעול, ללא קישור. **דה-דופ:** פגישת Nofar שנדחפה ל-Google תופיע גם ב-free/busy של עצמה — מזוהה ומדולגת לפי התאמת `[start,end]` מדויקת מול הפגישות הפנימיות. אומת בדפדפן מול היומן האמיתי המחובר — דה-דופ תקין (0 כפילויות על 3 פגישות פנימיות). typecheck/lint/build ירוקים (127+6 flaky suite לא קשור — `questionnaires-module.test.ts` עבר נקי בהרצה בודדת).

**מדיניות פרטיות:** Google לא קיבלה קישור ל-`claude.ai` (MISSING DOMAIN — הלקוחה לא הבעלים). נבנה דף `/privacy` בתוך האפליקציה עצמה (`app/privacy/page.tsx`, ציבורי, מחוץ ל-middleware) על הדומיין `nofar-clinic.vercel.app` שכבר משמש כ-redirect URI. כולל את הגילוי הנדרש (Google API Services User Data Policy + Limited Use), scopes, הצפנה, מיקום מידע EU, תיקון 13. קישור מה-footer של דף הבית. → הלקוחה מדביקה `https://nofar-clinic.vercel.app/privacy` ב-Branding, `https://nofar-clinic.vercel.app` כ-home page, ואז Publish App. **הלקוחה השלימה — Publishing status = In production** (מבטל תפוגת 7 ימים; אזהרת verification לא רלוונטית למשתמשת יחידה).

### 2026-09-01 (המשך) — היפוך: חסימות Google עברו מהאג'נדה למסך קביעת פגישה
לבקשת הלקוחה: האג'נדה `/t/calendar` חוזרת להיות נקייה (מטופלים בלבד, ללא Google) — `git checkout` לגרסת `8a6c2b3`. חסימות ה-Google עברו ל-`/t/calendar/new` + `/t/calendar/[id]/edit`: `buildGoogleBlocks` (`google-blocks.ts`, 45 יום קדימה, מקובץ+מפורמט לפי יום) → `AppointmentForm` (client, עוקב אחרי שדה `date`, מציג פאנל קריאה-בלבד עם צ'יפי טווחי-שעות ליום הנבחר). מוצג רק כשהיומן מחובר. אומת בדפדפן: `/t/calendar` נקי, `/t/calendar/new` מעדכן את הפאנל בהחלפת תאריך מול נתוני Google אמיתיים.

### 2026-09-01 (המשך ב') — מסך קביעת פגישה: תצוגת יום ורטיקלית + חסימת חפיפה
לבקשת הלקוחה, שני שיפורים למסך קביעת/עריכת פגישה:
1. **תצוגת יום ורטיקלית** (`day-timeline.tsx`, client) — במקום צ'יפים, ציר זמן אנכי (45px/שעה) עם תוויות שעה, חסימות Google + פגישות פנימיות קיימות כבלוקים ממוקמים לפי שעה בליין ימני, ו"הפגישה החדשה" כבלוק מקווקו בליין שמאלי; חופף → אדום + כיתוב. `google-blocks.ts` → `day-blocks.ts`, `buildDayBlocks(tdb, excludeId?)` מחזיר גם פגישות (`{startMin,endMin,kind,label}`), 45 יום, ממוין.
2. **חסימת חפיפה בשרת** — `createAppointmentAction`/`updateAppointmentAction` בודקים חפיפה מול פגישות קיימות (לא מבוטלות) + `googleBusy` לפני הכתיבה; חפיפה → שגיאה. checkbox "אפשר קביעה גם אם יש חפיפה" (`allowConflict`) לעקיפה מכוונת.
אומת בדפדפן מול Google אמיתי: תצוגת היום מציגה 5 חסימות של 2/9 בגבהים נכונים; ניסיון קביעה ב-09:00 (חופף חסימת Google) נדחה עם "השעה מתנגשת עם חסימה ביומן Google…". typecheck/lint/build ירוקים.

### 2026-08-31 — WP-32: Google Calendar (קוד)
מודול `modules/calendar-sync` (תשתית, getDb-backed, פטור מ-lint כמו core/email). `calendar_connection` (מיגרציה `0014`) — `refresh_token_enc` מוצפן AES-256-GCM (`CALENDAR_TOKEN_KEY`). `internal/google.ts` — לקוח REST כתוב-יד (authUrl/exchange/refresh/insert/patch/delete/freeBusy), scopes `calendar.events`+`calendar.freebusy`. מסלולים `/api/integrations/google/{connect,callback}` (state ב-cookie httpOnly). `syncAppointment(therapistId, appt)` נקרא `void` מ-4 actions (create/update/cancel של המטפלת + bookSlot של המטופל) — best-effort, `last_error` בלבד, `gcal_event_id` נכתב חזרה. `googleBusy()` מוזג ל-`SchedulingView.busyRanges` במסך הקביעה + ב-action. כרטיס "יומן Google" ב-`/t/settings` (מצב + חיבור + `disconnectGoogleAction`). ADR-041.
4 בדיקות crypto (round-trip / IV / GCM tamper / no-key). 133 בדיקות · lint · build ✓. **נבדק בדפדפן:** כרטיס ההגדרות מזהה `configured`, `/api/…/connect` מפנה ל-`accounts.google.com` עם client_id + redirect_uri (`http://localhost:3000/api/integrations/google/callback`) + שני ה-scopes + `access_type=offline`. degradation: ללא חיבור `googleBusy`→`[]`, `syncAppointment`→`null`, הקביעה העצמית עובדת.
**חסום על הלקוח:** scopes+test-user ב-Google Cloud · Publish app (Testing = טוקן פג כל 7 ימים) · env ב-Vercel. round-trip חי — אחרי זה.

### 2026-08-31 — WP-28 + WP-29: זמינות + קביעת תור עצמית
**WP-28 (זמינות + מנוע):** מודול `modules/availability` — `availability_rule` / `availability_exception` / `booking_policy` (מיגרציה `0013`, therapist-scoped). `computeOpenSlots` פונקציה טהורה ב-`slots.ts` (9 בדיקות) — rules − blocked − busy − buffer − lead − horizon. מסך `/t/settings/availability` (טוגל, 7 ימים, מדיניות, תאריכים חסומים).
**WP-29 (קביעה עצמית):** `SchedulingView` ב-`core/authz/internal` + `getSchedulingView()` (ADR-040) — קורא config של המטפלת + `busyRanges` אטומים (`{start,end}` בלבד). `bookSelfAppointment(pdb,…)` — insert דרך ה-guard, `scheduled` מיד (אישור אוטומטי). `bookSlotAction` מאמת מחדש מול view טרי. מסך `/p/appointments/new` + כפתור ב-`/p/appointments`.
ADR-039 + ADR-040. 129 בדיקות (114 → +15) · lint · build ✓. **נבדק בדפדפן מול Neon:** מטפלת הגדירה א׳–ה׳ 09:00–16:00 + טוגל → מטופל ראה חלונות (מכבד lead time) → קבע 12:00 → פגישה ביומן המטפלת ("מתוכננת") + בפגישות המטופל + התראה "מטופל/ת קבע/ה פגישה" → השעה נעלמה מהרשת (11:30/12:00/12:30 ירדו).
Google Calendar (WP-32) — הלקוח מקים OAuth client ב-Google Cloud, ממתין ל-credentials.

### 2026-08-31 — דיון היומן + הסתרת מודול ההודעות
**דיון (טרם קוד):** הלקוח רוצה (1) יומן מטפל מסונכרן עם Google Calendar, (2) קביעת תור עצמית ע"י מטופל לפי חלונות פנויים.
4 החלטות נסגרו: סנכרון A+B (דחיפה החוצה + קריאת "תפוס", ללא דו-כיווני מלא) · שם פרטי בלבד בכותרת אירוע Google · אישור אוטומטי לקביעת מטופל · סדר בנייה = לשיקול דעת. → מוקאפ + ADR + WP-32..35.
**הסתרת ההודעות (ADR-038):** `lib/features.ts` חדש (`FEATURES.messaging=false`). ניווט "הודעות" מוסתר בשני ה-shells · אריח "הודעות שלא נקראו" הוסר מדשבורד המטפל (grid→3) · `/t/messages`,`/t/messages/[patientId]`,`/p/messages` → `notFound()` · `sendMessageAction` מסרב · `modules/messaging/` + מיגרציה 0010 + בדיקות — נשמרו כמות שהם. 3 מחרוזות תיאור עודכנו. אומת בדפדפן (מטפל+מטופל: אין "הודעות" בניווט, שני המסלולים → 404). typecheck/lint/build/114 בדיקות ✓.

### 2026-08-31 — מסך הגדרות + front door
`/` (היה placeholder של WP-01) → front door אמיתי: מחובר→`/t`/`/p`, אחרת נחיתה ממותגת + כפתור "כניסה".
`/t/settings` (היה stub) → **החלפת סיסמה + הרשמת TOTP** (ADR-036) מעל פונקציות ה-auth מ-WP-02. נוסף `qrcode` (QR נוצר בשרת, `beginTotpAction`), `getAccountInfo` ל-`core/auth`.
נבדק בדפדפן מול Neon: הרשמת TOTP מקצה-לקצה (QR 180×180 + מפתח ידני → קוד תקף → "פעיל"). חשבון seed הוחזר ל-password-only אחרי הבדיקה.
**מדיניות סיסמה (ADR-037):** 10+ תווים בלבד, ללא כללי הרכב (מותר ספרות-בלבד). 114 בדיקות.

### 2026-08-31 — WP-23 מיקום מידע EU (חלק קוד)
`x-vercel-id` היה `fra1::iad1::…` — הקוד רץ ב-**iad1 (ארה"ב)** למרות ש-Neon בפרנקפורט. עיבוד PII מחוץ ל-EU.
**תיקון:** `vercel.json` → `{ "regions": ["fra1"] }` (ה-lever שה-Next.js adapter של Vercel מכבד). `preferredRegion` route-segment — deprecated ב-Next 16, לא בשימוש.
**נותר לפעולת לקוח:** Blob store באזור EU (אזור נקבע ביצירה; ליצור חדש + `BLOB_READ_WRITE_TOKEN` — קובץ הבדיקה היחיד יאבד) או S3 פרנקפורט; גיבוי Blob (→ WP-27). עד אז `data_transfer_abroad` (WP-10) = בסיס זמני. ADR-035.
מסמך + `vercel.json` בלבד — אין קוד אפליקציה/בדיקות. 114 סה"כ.

### 2026-08-31 — WP-22 חומרת בידוד — סקירה סופית
מעבר על כל route/endpoint + מודולים + guard + auth. `tests/isolation` = 67/67 (10 קבצים).
**2 פערי הגנה-בעומק נסגרו** (בטוחים כפי שנעשו בפועל — כל call-site מאמת דרך הגארד — אך הודקו):
(1) `core/fields.getFieldValues` סינן `therapist_id` בלבד → עכשיו `therapist_id AND patient_id`; `getFieldValuesFrom` מקבל `FieldScope`; `submitQuestionnaire` כותב עם `response.patientId` guard-forced.
(2) `createSession/createAppointment/createTask/createDocument` → מאמתים `tdb.findOne(patient, eq(id))` scoped לפני כתיבה (כמו `savePlanVersion`/`sendMessage`).
+3 בדיקות (`createX` למטופל של מטפל אחר → `patient_not_found`), 2 הודקו. סה"כ 114.
**probes זיוף על ה-deploy החי (כמטופל):** כל `/t/*` → redirect ל-`/login` · `/api/documents/<therapist_only של מטופל אחר>` → **404** · `/api/documents/<uuid אקראי>` → 404 · `POST /api/notifications` עם `ids` מזויפים → 200, שום רשומה לא סומנה.
**מסקנה: אפס ממצאי בידוד ניתנים לניצול.** 4 שכבות עצמאיות: ScopedDb guard · lint `no-restricted-imports` · route-group layouts · middleware. מסלולי מטופל ב-URL חסרי `[id]` פרט ל-`/api/documents/[id]` (מוגן+נבדק). ADR-034.

### 2026-08-31 — WP-21 נספח רגולציה ותפעול
נכתב `docs/OPERATIONS.md` (ADR-033) — המסמך הסוגר: גיבוי + תרגיל שחזור רבעוני · monitoring (Vercel/Neon/Resend + UptimeRobot על `/api/version`) · Dependabot · incident response (ה-audit append-only ככלי תחקיר) · DPAs + מיקום מידע (DB בפרנקפורט ✓, Blob ב-IAD1 ✗) · מדיניות שמירה 7ש'/2ש' מול anonymize+lock · "תיק חירום" להמשכיות · **תיקון 13 לחוק הגנת הפרטיות** (14.8.2025 — רישום ברשם בוטל, חובת ניהול/אבטחה, DPO כנראה לא נדרש למטפלת יחידה — טעון אישור עו"ד) · טבלת מיפוי מול תקנות אבטחת מידע · Data flow · checklist עלייה לפרודקשן.
**פערים → WP חדשים:** WP-23 (EU + Blob, חוסם) · WP-24 (`totp_secret` at-rest) · WP-25 (retention cron) · WP-26 (anonymize+lock) · WP-27 (`pg_dump` שבועי).
מסמך בלבד — אין קוד/מיגרציה/בדיקות. 111 סה"כ נשאר. `README.md` קיבל הפניה ל-`OPERATIONS.md`.
**DoD:** כל נושאי ה-spec מכוסים ✓ · פערי-קוד הפכו ל-WP ✓ · **ממתין לקריאה ואישור של הלקוח.**

### 2026-08-31 — WP-20 Therapist Dashboard
דשבורד `/t` (ADR-032): 6 קריאות מקבילות + `myUnreadCount()` — tiles (מטופלים פעילים / פגישות היום / הודעות שלא נקראו / התראות, מודגש כשיש) · "לוח היום" + "קרוב" (`listAppointments` from/to) · משימות פתוחות (עם שם מטופל) · טבלת "מטופלים אחרונים" (6 לפי joinedAt desc) עם `StatusPill` + פגישה אחרונה/הבאה (קבוצה לפי patientId).
מולאו פריטי nav שהיו 404: `/t/documents` (נוסף `listRecentDocuments(tdb)` — כל המסמכים לפי created_at + שמות, therapist-scoped) · `/t/settings` (stub קריאה — שם/תפקיד + "בקרוב" WP-21).
case ל-`listRecentDocuments` ב-`documents-module.test.ts` → 111 סה"כ. lint/typecheck/build ירוקים.
**נבדק בדפדפן מול Neon:** דשבורד "נופר" — 4 פעילים / 0 היום / 5 התראות · טבלת מטופלים אחרונים עם סטטוס + פגישה אחרונה · `/t/documents` מציג PDF של דנה · `/t/settings` מציג "נופר כהן". **responsive 375px** — rail→top bar, tiles נערמים. console נקי.

### 2026-08-31 — WP-19 Patient App Shell + Dashboard
דשבורד `/p` (ADR-031): מרכיב 4 קריאות מקבילות דרך `getPatientDb()` — הפגישה הבאה (`listAppointmentRows`) · משימות פתוחות (`listTaskRows`) · עדכונים אחרונים (`listTimeline` scoped) · באנר "שאלון ממתין" (`getQuestionnaire`). ללא service/טבלה חדשים.
`/p/profile` — קריאה בלבד; נוסף `getMyProfile(pdb: PatientDb)` ל-`modules/patients` (`self()` + `findMany` דרך ה-guard). nav מטופל הושלם: +"שאלון קליטה" +"פרופיל" (8 פריטים).
case ל-`getMyProfile` ב-`patient-isolation.test.ts` → 110 סה"כ. lint/typecheck/build ירוקים.
**נבדק בדפדפן מול Neon:** דשבורד "בדיקה התראה" — "אין פגישה קרובה" (הפגישה עברה), "0 משימות", 4 עדכונים עם אייקונים · פרופיל מציג שם + הצטרפות · nav מלא · **responsive 375px** — כרטיסים נערמים, nav גולש. console נקי.

### 2026-08-31 — WP-18 Questionnaire (שאלון קליטה)
`modules/questionnaires` (ADR-030): `questionnaire_response` (מיגרציה `0012`, הוחלה על Neon; dual-scoped, unique patient) — רק `status` (open/submitted) + `submitted_at`. **התשובות ב-`field_value`** (`entity='questionnaire'`, `entity_id=response.id`). נוספו 5 הגדרות `questionnaire` ל-`FIELD_REGISTRY` (סה"כ 8); `db:registry` הורץ.
service: `startResponse(pdb)` · `getQuestionnaire(db)` (שני scopes) · `submitQuestionnaire(pdb, patientId, answers)` — מטופל בלבד: `setFieldValuesIn` → status submitted → `recordEvent("questionnaire_submitted")`; re-submit מותר.
מסכים `/p/questionnaire` (`<FieldInput>` per def → אחרי הגשה `AnswersList` + "עריכה ושליחה מחדש" `?edit=1`) · `/t/patients/[id]/questionnaire` (קריאה + `audit view`). nav "שאלון קליטה" ב-patient shell · כפתור "שאלון" בתיק. ה-action מתריע למטפל (`questionnaire_submitted`).
6 בדיקות isolation → 109 סה"כ. lint/typecheck/build ירוקים.
**נבדק בדפדפן מול Neon:** "בדיקה התראה" מילא/ה 6 שדות → הוגש → תצוגת קריאה · מטפלת רואה ב-`/t/patients/[id]/questionnaire` · התראה "שאלון קליטה מולא" ב-`/t/alerts` · אירוע "שאלון קליטה הוגש" בציר הזמן. console נקי.

### 2026-08-31 — WP-08 File Storage + WP-17 Documents
`@vercel/blob` v2.8 נוסף · `core/files` (ADR-029): `putFile`/`getFileStream`/`deleteFile` — `access: "private"` בלבד, **אין URL ציבורי**. אילוצים ב-`core/files/labels.ts` טהור. הדלי `nofar-clinic-blob` (private, IAD1) נוצר וחובר לפרויקט; `BLOB_READ_WRITE_TOKEN` מוזרק ב-deploy (עדיין לא ב-`.env.local` מקומי).
`modules/documents` (מיגרציה `0011`, dual-scoped): `document` + service list/get/create/setVisibility/delete. `scopedWhere(db,base)` מוסיף `visibility=therapist_and_patient` בכל קריאה של `PatientDb` — `therapist_only` לא נגיש למטופל ב-list, ב-get, וב-route. `createDocument` כופה shared+uploadedBy=patient כשמטופל מעלה. `document_added` ל-Timeline. סוג התראה `document_shared` (union).
`GET /api/documents/[id]` — `getScopedDb()` → `getDocument` → `getFileStream` → stream (`inline`, `private, no-store`, `audit view`). בלי session → 401.
העלאה = פעולה אחת לשני התפקידים (`uploadDocumentAction` + `getScopedDb()`); `/p/documents` מייבא אותה + `UploadForm`. מסכים `/t/patients/[id]/documents` (סוג + נראות + toggle + מחיקה) · `/p/documents` (נראות כפויה). כפתור "מסמכים" בתיק.
`vitest.config`: `testTimeout 20000` · `hookTimeout 30000` · `retry 1` — חבילת auth נגעה מדי פעם ב-5s תחת עומס (16 קבצים, argon2+PGlite); לא באג.
5 בדיקות isolation (blob מוקד) → 103 סה"כ. lint/typecheck/build ירוקים (build ללא env).
**נבדק על ה-deploy החי** (token מוזרק): העלאת PDF אמיתית → Blob פרטי · הורדה דרך `/api/documents/[id]` → 200 + `%PDF` + `private, no-store` · toggle נראות · `/p/documents` של מטופל אחר ריק · **מטופל אחר מושך URL של מסמך `therapist_only` → 404** (כלל הזהב). מקומית ללא token — העלאה נכשלת בחן.

### 2026-08-30 — WP-16 Messaging
`modules/messaging` (ADR-028): `message_thread` (unique patient) + `message` (מיגרציה `0010`, הוחלה על Neon; dual-scoped). `read_at` = מתי הצד השני קרא — `markThreadRead` נוגע רק בהודעות `sender != db.role`; `unreadCountFor` (מטפלת: כל המטופלים; מטופל: ה-thread שלו). `sendMessage` יוצר thread בפעם ראשונה, מטפלת מוגבלת ל-`findOne(patient)` scoped לפני יצירה.
polling: `<ChatPoller>` (`router.refresh()` כל 12ש'/20ש'). פעולה אחת `sendMessageAction` דרך `getScopedDb()` — `/p/messages` מייבא אותה + את `MessageList`/`ChatComposer` מ-`(therapist)`. שליחה → `notify(message_received)` לצד השני (badge של פעמון WP-06 מתעדכן ב-poll). אין אירוע Timeline להודעה בודדת.
מסכים `/t/messages` (תיבה + "התחלת שיחה") · `/t/messages/[patientId]` (`markThreadRead` ברינדור + `audit view`) · `/p/messages` (שיחה יחידה). בועות מיושרות לפי sender + חיווי "נקרא".
5 בדיקות isolation → 98 סה"כ. lint/typecheck/build ירוקים (build ללא env).
**נבדק בדפדפן מול Neon:** מטפלת שלחה ל"בדיקה התראה"; המטופל התחבר, ראה **רק** את השיחה שלו, "נקרא" חזר למטפלת; המטופל השיב → בתיבת המטפלת badge "1" + ההודעה האחרונה. (שליחה ב-automation דרך `form.requestSubmit()` — כפתור קטן; הטופס תקין.) console נקי.

### 2026-08-30 — WP-15 Tasks
`modules/tasks` (ADR-027): `task` (מיגרציה `0009`, הוחלה על Neon; dual-scoped) + service list/get/create/update/delete + `setTaskStatus(db, id, status)` שמקבל `TherapistDb | PatientDb` (המטופל מסמן "בוצע"). Timeline: `task_created` / `task_completed` (idempotent). `labels.ts` טהור ל-client.
פעולה אחת לשני הצדדים: `setTaskStatusAction` ב-`app/(therapist)/.../tasks/actions.ts` דרך `getScopedDb()`; `/p/tasks` מייבא אותה; מטופל שמסיים → `notify(task_completed)` למטפל (סוג חדש ב-union). מסכים `/t/patients/[id]/tasks` (+ `/new` `/[taskId]/edit`) · `/p/tasks` (checkbox = server-action form, אפס client JS) · כפתור "משימות" בתיק + "משימה מהמפגש" במסך המפגש (חיווט שלב המשימות מ-WP-13).
6 בדיקות isolation → 93 סה"כ. lint/typecheck/build ירוקים (build ללא env). *הערה: ריצת test מלאה אחת הראתה flake ב-`auth.test.ts` (timing, argon2 תחת עומס); ריצה חוזרת ירוקה.*
**נבדק בדפדפן מול Neon:** מטפלת יצרה משימה ל"דנה" (timeline created+completed) · משימה ל"בדיקה התראה"; המטופל התחבר, ראה **רק** את שלו, סימן "בוצע" → למטפלת התראה "משימה סומנה כבוצעה" ב-`/t/alerts`. console נקי.

### 2026-08-30 — WP-14 Treatment Plans + גרסאות
`modules/plans` (ADR-026): `treatment_plan` (unique patient) + `treatment_plan_version` append-only (מיגרציה `0008`, הוחלה על Neon; שני הrows scoped therapist+patient). `savePlanVersion` — כל save = `version_no+1`, ערכי שדות מול מזהה הגרסה החדש (גרסאות קודמות לא נדרסות), `current_version_id` מתעדכן, `plan_changed` ל-Timeline + `notify` למטופל (critical → גם אימייל).
תוכן דרך Field Registry: נוספו 4 הגדרות `entity=plan_version` (`nutrition`/`supplements`/`lifestyle`/`goals`, code-defined); `pnpm db:registry` הורץ מול Neon.
**תיקון `core/fields/store.ts`:** כתיבה ריקה (`null`/`""`/`[]`) מדלגת/מוחקת row במקום לכתוב null ולקרוס על `value` NOT NULL (23502). חל גם על מפגשים (WP-13). נוספה בדיקת רגרסיה.
מסכים: `/t/patients/[id]/plan` (נוכחית + היסטוריה + audit view) · `/plan/edit` (`<FieldInput>`, מאותחל מהגרסה הנוכחית) · `/plan/v/[versionId]` (היסטורית, קריאה) · `/p/plan` (מטופל, נוכחית בלבד) · כפתור "תוכנית" בתיק.
6 בדיקות isolation → 87 סה"כ. lint/typecheck/build ירוקים (כולל build ללא env).
**נבדק בדפדפן מול Neon:** "דנה פרץ" — גרסה 1 (תזונה+יעדים) → גרסה 2 (תוספים + note "הוספת תוספי מגנזיום ואומגה 3"); היסטוריה 2→1; גרסה 1 ההיסטורית ללא התוספים; Timeline: "נוצרה" + "עודכנה — גרסה 2 · <note>". console נקי.

### 2026-08-30 — WP-13 Treatment Sessions
`modules/sessions` (ADR-025): `treatment_session` (מיגרציה `0007`, הוחל על Neon) — `appointment_id` nullable + 7 עמודות טקסט חופשי · service `listSessions`/`getSession`/`createSession`/`updateSession` (מקבלים `TherapistDb`) · `assertAppointment` (guard) · מדדים דרך Field Registry (`entity=treatment_session`).
`setFieldValuesIn`/`getFieldValuesFrom` הפכו ל-wrappers שמזריקים `getDb()`; נוסף `__setActiveDb` ל-`client.ts` ו-`createTestDb()` מצביע את `getDb()` על ה-PGlite של הבדיקה (כך שה-wrappers עובדים ב-isolation).
מסך "זרימה אחת" `/t/sessions/new` (טופס יחיד, 3 חלקים ממוספרים, `<FieldInput>` משובץ בחלק 1) · `/[id]` + `/[id]/edit` · `SessionForm` משותף · `SESSION_SECTIONS` ל-`sections.ts` טהור (לא למשוך `getDb`→`node:fs` ל-client bundle) · כניסה מהתיק ("מפגש") ומפרטי פגישה ("תיעוד מפגש", `?appointment=`).
6 בדיקות isolation → 81 סה"כ. lint/typecheck/build ירוקים (כולל build ללא env).
**נבדק בדפדפן מול Neon:** מפגש ל"דנה פרץ" — מדדים (אנרגיה 8 / שינה 7 / משקל 68.4) נשמרו+אומתו+הוצגו · timeline "תיעוד מפגש" (מפגש טיפולי) · `/t/audit` = create(treatment_session)+create(timeline_event)+view(treatment_session). console נקי.

### 2026-08-30 — WP-12 Appointments
`modules/appointments` (ADR-024): `appointment` (מיגרציה `0006`, הוחל על Neon) — therapist+patient scoped, status `scheduled/done/cancelled/no_show`, `gcal_event_id` nullable.
service: `listAppointmentRows` (גולמי, שני scopes) · `listAppointments` (מוסיף `patientName`, TherapistDb) · `getAppointment` · `create/update/setAppointmentStatus` · סינון from/to/patient/status ב-SQL.
כל mutation → `recordEvent(type:"appointment", occurredAt:startsAt, refId)` + התראת in-app למטופל (`appointment_scheduled/changed/cancelled` — נוספו ל-union של `notificationType`, אין מיגרציה כי `text enum`). `getPatientUserId` נוסף ל-`core/auth`.
`lib/tz.ts`: `CLINIC_TZ=Asia/Jerusalem`, `fromClinicWallTime`/`toClinicFields`/`clinicWeekStart`/`clinicDateFmt` — קלט שעון-קיר, רינדור עם `timeZone` מפורש.
מסכים: `/t/calendar` (agenda שבועי, ניווט ‹היום›, צ'יפים לפי status) · `/new` + `/[id]` (כפתורי סטטוס כ-server-action forms) + `/[id]/edit` · `AppointmentForm` משותף · `/p/appointments` (קריאה בלבד, קרובות/קודמות) · כפתור "פגישה" בתיק (`?patient=`).
`StatusPill` הועבר מ-`patients/page.tsx` ל-`status-pill.tsx` (המשך תיקון WP-11 route-export). 6 בדיקות isolation → 75 סה"כ. lint/typecheck/build ירוקים (כולל build ללא env).
**נבדק בדפדפן מול Neon:** פגישה ל"דנה פרץ" 09:00 → agenda + פרטים + timeline "פגישה נקבעה" · מטופל "בדיקה התראה" (הזמנה חדשה) רואה **רק** את הפגישה שלו (11:00 רפלקסולוגיה) · round-trip tz תקין. console נקי (רק HMR ws).

### 2026-08-30 — WP-11 Patient File + Timeline
`modules/patient-file` (ADR-023): `listTimeline`/`countTimeline` לצד `recordEvent` — `TherapistDb | PatientDb` (cast ל-union), סינון בשאילתה (`types[]` inArray · `gte/lte` על `occurred_at` · מיון desc/asc) · תקרת 500 על האינדקס הקיים `(patient_id, occurred_at)` · `TIMELINE_LABEL` עברית במודול, `TIMELINE_ICON` ב-UI.
מסך `/t/patients/[id]`: כרטיס "ציר זמן" — צ'יפים `?ev=<type>` + `<PatientTimeline>` (רכיב render טהור: קיבוץ יומי "היום"/"אתמול"/תאריך, פס `border-s` עם בועות אייקון); כותרת = סה"כ אירועים (לא מסונן). הוסר ה-placeholder של WP-10.
6 בדיקות isolation (`patient-file-timeline.test.ts`) — cross-therapist ריק · patient handle רק את עצמו · מיון · סינון סוג · חלון תאריכים · תקרת 500. 69 סה"כ · lint/typecheck/build ירוקים.
**נבדק בדפדפן מול Neon:** תיק "דנה פרץ" — "נוספ/ה למערכת" תחת "היום" @ 20:26, תווית "סטטוס"; `?ev=appointment` → מצב ריק. console נקי (רק HMR ws של הפריוויו).
**CI hiccup:** ה-build נפל על `StatusPill` שיוצא מ-`patients/page.tsx` — Next 16 אוסר export לא-סטנדרטי מקובץ route (`{ [x: string]: never }`). הועבר ל-`status-pill.tsx` נפרד (commit `b9035e7`). לוקאלית עבר (Node 24) אבל נפל ב-CI (Node 22) — הכלל תקף בכל מקרה.

### 2026-08-30 — WP-10 Patients + version stamp
**חותמת גרסה:** `next.config` מטביע git SHA + build time → `GET /api/version` + כותרת תחתונה של `/`. אומת חי (d20e15d).
**WP-10** (ADR-022): schema מורחב + `patient_treatment_type` + `consent` (מיגרציה 0005) · `modules/patients` service (list/get/create/update/setStatus) — מקבל `TherapistDb` ·
`ScopedDb.list()` (order/pagination) + `ListOpts` · `patient-file/index.ts` `recordEvent()` מינימלי (cast ל-`TherapistDb` לקריאת ה-union) ·
מסכים `/t/patients` + `/new` + `/[id]` + `/[id]/edit` · `PatientForm` משותף · nav "מטופלים" כבר קיים · תיקון icon `session`→`plan`, `react-hooks/purity` disable ל-server component ·
5 בדיקות isolation (sink כמערך במקום insert async — מנע race) · 63 סה"כ · נבדק בדפדפן מול Neon: יצירת "דנה פרץ" → תיק, ו-`/t/audit` הראה create×3 + view.
**מהלקוח:** לוגו (screenshot בלבד) + כותרת מקצועית התקבלו; ביקש להתעלם מבקשות נוספות עד הודעה.

### 2026-08-30 — WP-06 Notification Center
Vercel env הוגדר (`RESEND_API_KEY`/`EMAIL_FROM`/`APP_URL`), `DATABASE_URL` + Neon vars אושרו, נוסף fallback `POSTGRES_URL` ב-`client.ts`.
`core/notifications` (ADR-021): טבלת `notification` + מיגרציה `0004` · `internal/store.ts` (create/list/unreadCount/markRead — scoped ל-recipient) · `internal/notify.ts` (יצירה + אימייל לאירוע קריטי, fail-open) · `index.ts` · `server.ts` ·
`app/api/notifications/route.ts` (GET count+items / POST mark) · `app/notification-bell.tsx` (polling 30ש', popover) בשני ה-shells · `/t/alerts` + server action mark-all ·
טריגרים: invite accept → `getTherapistUserId` + `notify(patient_joined)` · reset complete → `notify(password_changed)` (+אימייל); `completePasswordReset` מחזיר גם `therapistId`, `AuthResult.ok`+`therapistId`, `acceptInvite`+ids ·
`shadcn add popover` · `core/notifications`+`core/email` ל-lint allowlist · תיקון therapist-shell: `headerSlot` נראה גם במובייל · 4 בדיקות · 58 סה"כ · build ירוק · **נבדק בדפדפן**: מטופל→הזמנה→התראה למטפל ב-`/t/alerts` + badge=1.

### 2026-08-30 — WP-07 Email (Resend)
הלקוח מסר creds (key בצ'אט → לאפס): דומיין `nofar-health.com`, from "נופר כהן <nofar@nofar-health.com>". `.env.local` עודכן (`RESEND_API_KEY`/`EMAIL_FROM`/`APP_URL`).
`core/email` (ADR-020): `internal/client.ts` (Resend, fail-open, skipped בלי key) · `internal/templates.ts` (4 תבניות RTL, inline styles, layout משותף) · `index.ts` (`send*Email` + `appUrl`) ·
`/forgot` שולח דוא"ל אמיתי · `scripts/send-test-email.ts` — **בדיקת שליחה חיה ל-nofar@nofar-health.com הצליחה** (`ok:true`, id הוחזר → הדומיין מאומת) · 3 בדיקות · 54 סה"כ · build ירוק.

### 2026-08-30 — WP-09 Field Registry
`core/fields` (ADR-019): `field_definition`/`field_value` + מיגרציה `0003` · `internal/field-schema.ts` (`fieldSchemaSchema` discriminated-union + `compileFieldSchema`→Zod) ·
`internal/validate.ts` (`validateFieldValue` + `FieldValidationError` עם `fieldKey`) · `internal/registry.ts` (`FIELD_REGISTRY` 6 שדות + `assertRegistryValid` + `loadRegistry`) ·
`internal/store.ts` (`setFieldValues`/`getFieldValues` — validate on write+read) · `index.ts` · `field-input.tsx` (client, 6 סוגים, scale=pills) ·
`core/fields` ל-lint allowlist · seed טוען registry · `scripts/load-registry.ts` + `pnpm db:registry` (הורץ מול Neon) · 14 בדיקות (compile/validate/registry-rules/store) · 51 סה"כ · build ירוק.
תיקון: `z.core.$ZodIssue` לא יציב → issues כ-`{message,path}[]`; `@ts-expect-error` על schema חסר לא נחוץ (drizzle לא אוכף NOT NULL בטיפוס) → `null as unknown as object`.

### 2026-08-30 — WP-05 Audit Log
`core/audit` (ADR-018): `audit_log` + טבלת trigger append-only (migration `0002`, מותאם ידנית ל-SQL) · שירות record/query/purge · `server.ts` `audit()` ·
`ScopedDb` הורחב עם `ScopedAuditSink` — כל write ממוקד פולט אירוע, `getTherapistDb`/`getPatientDb` מחווטים ל-`recordAudit` · `audit("login")` ב-login action, `audit("invite")` ב-accept · `acceptInvite` מחזיר גם `therapistId`/`patientId`, `AuthResult.ok`+`therapistId` ·
מסך `/t/audit` (server, פילטרים GET) + פריט nav "יומן פעילות" · `core/audit` נוסף ל-lint allowlist · 7 בדיקות (round-trip/filters/scoping/append-only/purge/auto-audit) ·
תיקון: cast `as TherapistDb` (union לא callable ב-`next build` TS) · trigger error עטוף ב-DrizzleQueryError (בדיקה בודקת `P0001`/שם הפונקציה) · נבדק בדפדפן: login → רשומה במסך יומן. 37 בדיקות + build ירוקים.

### 2026-08-30 — WP-04 Data Layer + RLS spike (Neon)
הלקוח יצר Neon (Frankfurt `eu-central-1`) — תחילה MongoDB בטעות, תוקן. `.env.local` נוצר (gitignored). **הסיסמה הודבקה בצ'אט → לאפס.**
נוסף `postgres` (postgres.js). `client.ts` נכתב מחדש — בחירת driver לפי `DATABASE_URL` (Postgres `prepare:false` ל-pooler / PGlite memory לבדיקות / PGlite file לוקאלי / `DbNotConfiguredError` על Vercel בלי env).
`migrate.ts` — Postgres דרך unpooled + advisory lock; `load-env.ts` (`process.loadEnvFile`) ל-scripts; `drizzle.config` טוען env + `dbCredentials`. `testing.ts` cast ל-`Db`.
`db:migrate` + `db:seed` הורצו מול Neon בהצלחה. **התחברות נבדקה בדפדפן מקומית מול Neon** (נופר → `/t`).
**RLS spike** (`scripts/rls-spike.ts`): `SET LOCAL` ב-txn עובד דרך ה-pooler; אבל `neondb_owner` = `rolbypassrls` → RLS נעקף. **ADR-017: RLS נדחה, הגארד יחיד.** 30 בדיקות + build ירוקים.

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
