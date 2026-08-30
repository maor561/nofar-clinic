# DECISIONS — לוג החלטות (ADR)

Append-only. לא עורכים רשומה קיימת; אם החלטה משתנה — רשומה חדשה שמפנה לישנה ("מחליף את ADR-NNN").

---

## ADR-001 — פלטפורמה: Next.js App Router על Vercel
**תאריך:** 2026-08-29 · **סטטוס:** נעול
Full-stack אחד (App Router), פריסה על Vercel עם preview deployments.
**למה:** RTL מלא, קוד אחד, פריסה מיידית, הסביבה כבר מכוונת לכך, עקבי עם פרויקטים קודמים.
**נדחו:** backend נפרד (Node/Python) — מיותר למטפל יחיד; Remix/SvelteKit — פחות תמיכה/היכרות.

## ADR-002 — מסד נתונים: Postgres (Vercel Marketplace / Neon), אזור פרנקפורט
**תאריך:** 2026-08-29 · **סטטוס:** נעול (עם סייג)
Postgres מנוהל דרך Vercel Marketplace, region האיחוד האירופי (פרנקפורט).
**למה:** הלקוח ביקש "ישראל בלבד"; אין ל-Marketplace region בישראל. חוק הגנת הפרטיות הישראלי מתיר העברת מידע לאיחוד האירופי (רמת הגנה נאותה). נוסיף **הסכמת העברת מידע לחו"ל** בטופס קליטת המטופל.
**סייג:** אם יתברר צורך ב"ישראל ממש" — לשקול Postgres ב-AWS/Azure region תל אביב (מחוץ ל-Marketplace). רשומה חדשה אם משתנה.
**נדחו:** Supabase — הועדף Marketplace לפי בקשת הלקוח; Neon EU נבחר.

## ADR-003 — אימות: Auth.js self-hosted, Email+Password, session במסד
**תאריך:** 2026-08-29 · **סטטוס:** נעול
Auth.js (NextAuth), אימות email+סיסמה, sessions ב-DB. איפוס/שינוי סיסמה, נעילת חשבון, rate-limiting — באחריותנו.
**2FA:** TOTP **למטפל כבר ב-v1** (עדכון מול האפיון שאמר "שלב עתידי") — לפי המלצת מועצת הביקורת: email+סיסמה בלי second factor הוא וקטור הפריצה האמיתי למידע רגיש. 2FA למטופל — שלב 2.
**נדחו:** Clerk — מידע משתמשים בשירות חיצוני בארה"ב, מתנגש עם דרישת מיקום המידע; עלות בקנה מידה.

## ADR-004 — נתונים גמישים: Field Registry + JSONB, עם ולידציה מחייבת
**תאריך:** 2026-08-29 · **סטטוס:** נעול
מדדים / שדות טיפול פר-תחום / שאלונים = טבלת הגדרות שדה (`field_definition`) + ערכים ב-JSONB.
**כללי ברזל (לפי מועצת הביקורת + סקירת שוק):**
1. כל הגדרת שדה כוללת סכמת Zod. אין סכמה → אין שדה.
2. כל קריאה/כתיבה ל-JSONB עוברת דרך validator יחיד.
3. מדד שמוצג בגרף / נדרש לשאילתות אגרגציה → **עמודה אמיתית או generated column**, לא JSONB בלבד.
4. אין בונה טפסים גרפי ב-v1 — הגדרות דרך קוד/seed או מסך פשוט.
**למה:** האפיון (סעיף 32) דורש הרחבה בלי שכתוב. השוק מאמת (כל כלי רציני עושה "smart forms"). הכללים מונעים את המלכודת של "כלי הזנה שאי אפשר לתשאל".

## ADR-005 — ישות מטפל + `therapist_id` על כל רשומה
**תאריך:** 2026-08-29 · **סטטוס:** נעול
ישות `therapist` קיימת; כל טבלת דומיין נושאת `therapist_id`. ה-UI וההרשאות מניחים מטפל יחיד.
**למה:** עלות זניחה עכשיו; חוסך מיגרציה גדולה אם ירצו קליניקה בעתיד; גם עמודת scope שנייה להגנת בידוד.
**לא:** לא בונים ניהול ריבוי-מטפלים, הזמנות מטפלים, או בידוד בין מטפלים ב-v1.

## ADR-006 — Google Calendar: חד-כיווני מערכת→Google, בשלב 2
**תאריך:** 2026-08-29 · **סטטוס:** נעול
כיוון הסנכרון: מערכת → Google בלבד. המבנה יאפשר דו-כיווני בעתיד.
**תזמון:** המימוש עצמו מוזז ל**שלב 2** (חיתוך סקופ מועצה). היומן הפנימי עובד לבד ב-v1.
**שים לב:** סנכרון מדליף שם מטופל/פרטי פגישה ל-Google — או לוודא שההסכמה מכסה, או לסנכרן כותרת אטומה ("פגישה — [מזהה]").
**נדחו:** דו-כיווני ב-MVP — webhooks + פתרון התנגשויות, מכפיל מורכבות.

## ADR-007 — התראות: מרכז במערכת + דוא"ל לאירועים קריטיים
**תאריך:** 2026-08-29 · **סטטוס:** נעול
Notification Center בתוך המערכת; דוא"ל טרנזקציוני לאירועים קריטיים (הזמנה, איפוס סיסמה, פגישה קרובה, שינוי תוכנית).
Push / SMS / WhatsApp — שלב 3.
**פתוח:** בחירת ספק דוא"ל (מומלץ Resend). נקודת כשל יח' — לתעד fallback.

## ADR-008 — שפה: עברית בלבד, RTL
**תאריך:** 2026-08-29 · **סטטוס:** נעול
כל הממשק עברית, RTL מלא. בלי תשתית i18n ב-v1. הטקסטים מרוכזים בקובץ אחד כדי לאפשר אנגלית בעתיד בלי retrofit.

## ADR-009 — אבטחה: רמה "גבוהה"; guard בשכבת האפליקציה כבקרה ראשית, RLS כהגנה בעומק
**תאריך:** 2026-08-29 · **סטטוס:** נעול
מתכננים לפי "רמת אבטחה גבוהה" בתקנות הגנת הפרטיות (אבטחת מידע): הצפנה, בקרת גישה קשיחה, Audit Log מלא, גיבויים.
**שכבות בידוד:**
1. **ראשית:** scoping guard בשכבת האפליקציה — אי אפשר לקבל DB handle בלי scope של מטפל+מטופל. כל נתיבי הנתונים (server actions, route handlers, RSC, cron, webhooks) עוברים דרכו.
2. **הגנה בעומק:** Postgres RLS — **בכפוף ל-spike**: `SET LOCAL`/`set_config` עלול לא לשרוד transaction-mode pooling ב-Neon. אם שביר → RLS משני, ה-guard נושא את המשקל.
3. **הוכחה:** חבילת בדיקות cross-tenant ב-CI ובכל סשן — token של מטופל B מול כל route/מזהה של מטופל A → 403/404. הבדיקה = הגדרת "גמור" לדרישה הקריטית.

## ADR-010 — מסמכי קונטקסט: סט רזה + נוהל סשן
**תאריך:** 2026-08-29 · **סטטוס:** נעול
6 מסמכים + `CLAUDE.md` (ולא 9). `STATUS.md` מאחד PROGRESS + SESSION_LOG. קונבנציות בתוך `ARCHITECTURE.md`.
**למה:** מועצת הביקורת — אף אחד לא מתחזק 9 קבצי MD; סשן עייף ב-23:00 בטח לא.

## ADR-011 — Build vs Buy: בונים, בהיקף מצומצם
**תאריך:** 2026-08-29 · **סטטוס:** נעול
נבדק השוק (בינלאומי + ישראלי). אין מוצר מדף אחד שנותן: עברית RTL + רמת פרטיות ישראלית + עומק קליני מובנה + פורטל מטופל דו-כיווני עם הזנה עצמית.
טיפולוג/קליניקלאוד/קומד = עברית+ציות, רדוד קלינית. Practice Better/Healthie/OptiMantra = עומק, אך אנגלית+ארה"ב+ניווט עמוס.
**החלטה:** לבנות. v1 נראה כמו "טיפולוג + תיק/Timeline אמיתי + פגישות מובנות", לא clone של Practice Better.
**מקורות:** Supplement Practice buyer's guide; Capterra/GetApp comparisons; choosingtherapy reviews (Practice Better, Healthie); Pabau (Jane alternatives); virtuwellbalance; tipulog.co.il; clinicloud.co.il; tevaclub.co.il (קומד). מלא בהיסטוריית שיחת התכנון.

## ADR-012 — שפה ויזואלית ותהליך עיצוב
**תאריך:** 2026-08-29 · **סטטוס:** נעול
- **Calm Wellness** — נייטרלים חמים, פינות מעוגלות, הרבה אוויר, טיפוגרפיה רכה.
- **Desktop-first** — מסכים עשירים לרוחב מלא; מובייל fallback איכותי.
- **צפיפות מאוזנת** — מסך מטופל + דשבורד עשירים ומרוכזים; זרימות הזנה מודרכות ונקיות.
- **תהליך:** מוקאפים אינטראקטיביים למסכים המרכזיים → אישור → קוד.
- **Design system:** Tailwind + shadcn/ui מותאם RTL, פלטת Calm Wellness.
- **Light בלבד** ב-v1.

## ADR-013 — חיתוך סקופ v1 (לפי מועצת הביקורת)
**תאריך:** 2026-08-29 · **סטטוס:** נעול
**v1 = core + 4 מודולי דומיין + פורטל מטופל קריאה-בעיקר:**
core (scaffold/CI, design system, Auth+2FA, scoping guard, data layer, Audit log, notification center, file storage, Field Registry, email) ·
Patients · Patient File + Timeline · Treatment Sessions · Appointments (יומן פנימי) ·
פורטל מטופל: צפייה בתוכנית/פגישות/משימות/מסמכים + הודעות + שאלון קליטה אחד.
**שלב 2:** מעקב מדדים + הזנה יומית של המטופל + תזונה + מנוע שאלונים מלא + Google Calendar + תבניות טיפול.
**למה:** ~25 מודולים זה roadmap, לא MVP. מוכיחים את הליבה והבידוד על שלד קטן, כל מודול נוסף מתחבר לערובה שכבר עובדת.

## ADR-014 — מימוש Design System: shadcn/ui (radix) ממופה ל-Calm Wellness
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מרחיב את ADR-012**
- **shadcn/ui** אותחל עם `--base radix --rtl --css-variables` (סגנון radix-nova). הפרימיטיבים יושבים ב-`components/ui/*` ומטופלים כ-vendored (כמו תלות).
- **גבול ייבוא:** קוד אפליקציה ומודולים מייבאים UI רק מ-`@/modules/core/design-system` (index.ts), לא מ-`@/components/ui/*` ישירות. אכיפת lint — ב-WP-03. עד אז קונבנציה (עקבי עם ARCHITECTURE §4.4).
- **Tokens:** שמות ה-tokens הסמנטיים של shadcn (`--primary`, `--card`, `--muted`, `--sidebar-*`...) ממופים בפלטת Calm Wellness ב-`app/globals.css`. בנוסף חשופים utilities `bg-sage-*`, `text-ink-*`, `bg-warn-*` וכו'.
- **Light בלבד:** בלוק `.dark` לא הוגדר; `color-scheme: light` נעול. `sonner` פושט מ-`next-themes`.
- **אייקונים:** סט stroke משלנו (`Icon` ב-design-system) למשטחי מוצר, במקום lucide, לשמירת השפה הוויזואלית. lucide נשאר זמין לרכיבי shadcn פנימיים.
- **RTL:** `Direction.Provider` של radix ב-`app/providers.tsx` (מיקום נכון של popovers/menus), בנוסף ל-`<html dir="rtl">`.
- **DoD של WP-01:** דף `/design` מרנדר כל token/רכיב/shell/מצב. נבדק בדפדפן — RTL, פונטים, פלטה, שני ה-shells תקינים.
**נדחו:** רכיב `sidebar` של shadcn — כבד ואטום; נבנה shell פשוט משלנו. Prisma-style theme — לא רלוונטי. פלטת ברירת המחדל (neutral OKLCH) — הוחלפה במיפוי Calm Wellness.

## ADR-015 — Auth: שכבת credentials + sessions כתובה בבית (במקום Auth.js)
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מחליף את חלק "Auth.js self-hosted" ב-ADR-003**
נשמר מ-ADR-003: email+סיסמה · sessions **במסד** · איפוס/שינוי סיסמה + נעילה + rate-limit באחריותנו · **TOTP למטפל כבר ב-v1**.
משתנה: לא משתמשים ב-Auth.js. נכתבה שכבה דקה ב-`modules/core/auth`.

**למה:** ה-Credentials provider של Auth.js כופה `strategy: "jwt"`; sessions במסד (דרישת ADR-003) דורשים עקיפה שבירה שנשברת בכל שדרוג. למערכת מידע רפואי צריך שליטה מלאה ב-revocation/rotation, "נתק את כל המכשירים", נעילה, ו-audit לכל session — ~250 שורות כתובות ידנית פשוטות ובר-ביקורת יותר מהתאבקות עם Auth.js. אין ספקי OAuth (מטפלת יחידה + מטופלים מוזמנים).

**מה נבנה (WP-02 שלב א'):**
- **סיסמאות:** argon2id (`@node-rs/argon2`, פרמטרי OWASP: m=19MiB, t=2, p=1). מדיניות: ≥10 תווים, אות + ספרה.
- **Sessions:** טוקן אטום (~192 ביט); ב-DB נשמר רק `sha256`. חיים מוחלטים 7 ימים + רוטציה כשעבר יום מ-last-seen. `revokeSession` / `revokeAllForUser` / `purgeExpiredSessions`.
- **הגנה מפני brute-force:** נעילת חשבון אחרי 5 כשלונות ל-15 דק' + חנק IP עצמאי (15 כשלונות/15 דק') · טבלת `login_attempt` כ-audit.
- **TOTP** (`otpauth`) — enrollment דו-שלבי, אימות עם window=1. הסוד ב-plaintext כרגע — הצפנה at-rest = פריט ל-WP-21.
- **הזמנת מטופל:** טוקן חד-פעמי, 7 ימים, `sha256` ב-DB; `acceptInvite` מפעיל את החשבון וקובע סיסמה בלחיצה אחת.
- **איפוס סיסמה:** טוקן חד-פעמי, שעה; `completePasswordReset` מבטל את כל ה-sessions; אין account enumeration.
- **DB:** Drizzle + PGlite מקומית (מקדים את המלצת WP-04 ל-ORM). סכימה זהה תרוץ על Neon ב-WP-04. מיגרציות ב-`modules/core/data/migrations`. seed = נופר + 2 מטופלים.
- **17 בדיקות** ב-`modules/core/auth/auth.test.ts` (env=node, PGlite in-memory).

**שלב ב' (הבא):** route handlers / server actions · middleware → request context (התפר שאליו נכנס ה-guard ב-WP-03) · מסכי התחברות/הזמנה/איפוס/TOTP מהמוקאפים · `import "server-only"` בשכבת ה-routes.
**נדחו:** Auth.js עם עקיפת DB-sessions — שביר; Lucia — בארכיון; JWT-only sessions — מתנגש עם ADR-003 ועם דרישת ה-revocation.

## ADR-016 — Scoping Guard: ScopedDb מטופס, ללא raw handle
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש את ARCHITECTURE §5 ואת הדרישה הקריטית**
`modules/core/authz` הוא נקודת האכיפה היחידה. אין נתיב לגיטימי ל-DB בלי scope.

**מבנה:**
- `internal/scoped-db.ts` — `TherapistDb` / `PatientDb`. ה-Drizzle handle ב-field `protected` בלי accessor ציבורי.
  כל `findMany`/`findOne`/`count`/`insert`/`update`/`delete` מוסיף `AND therapist_id = <scope>` (ובצד מטופל גם `patient_id`).
  `PatientDb.self()` לשורת ה-`patient` השורשית (שאין לה `patient_id` משלה). `scopeWhere(table, extra?)` כ-escape hatch בטוח לשאילתות מורכבות.
- `index.ts` — `scopedDbFor(db, session)` (טהור, נבדק). `server.ts` — `getTherapistDb()`/`getPatientDb()` (`server-only`): מאמת session + role + מחזיר scoped handle.
- **טיפוסים:** מתודות דורשות שהטבלה תישא את עמודות ה-scope. `PatientDb` לא יכול אפילו לנקוב בטבלה בלי `patient_id`.
- **Lint:** `no-restricted-imports` ב-`eslint.config.mjs` חוסם `@/modules/core/data/client` ו-`getDb` בכל `app/**` ו-`modules/**` פרט ל-`core/{data,authz,auth}` ולבדיקות. (`DbNotConfiguredError` מותר, נחשף מ-`authz`.)
- **בדיקות:** `tests/isolation/patient-isolation.test.ts` — 11 מקרים על `patient` + `timeline_event`: קריאה, כתיבה חוצת-גבול = 0 שורות, insert מאלץ scope, ניסיון bypass נכשל. רץ ב-CI.
- נוספה טבלת `timeline_event` מינימלית (`modules/patient-file/schema.ts`, מיגרציה `0001`) כטבלה שנייה אמיתית ל-suite; WP-11 ירחיב.

**נדחו:** wrapper שמסתמך על משמעת (domain dev זוכר להוסיף `WHERE`) — לא "בלתי ניתן לעקיפה". RLS כשכבה יחידה — WP-04 spike, בינתיים ה-guard נושא לבד.

## ADR-017 — RLS נדחה; ה-Scoping Guard הוא האכיפה היחידה ל-v1
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **סוגר את ה-spike של ADR-009**
Spike מול Neon (endpoint pooled, פרנקפורט) — `modules/core/data/scripts/rls-spike.ts`.

**ממצאים:**
- `SET LOCAL` / `set_config(_, _, true)` בתוך `sql.begin(...)` — **עובד** דרך ה-pooler. הדאגה מ-ADR-009 (transaction-mode pooling) אינה החסם.
- **`neondb_owner` (משתמש ברירת המחדל) הוא `rolbypassrls = true`** → RLS נעקף לחלוטין לחיבור של האפליקציה. ה-probe החזיר את כל השורות עם ובלי scope.
- הרול כן יכול ליצור roles (`rolcreaterole`), אז *אפשר* להקים רול מוגבל (`NOBYPASSRLS`) עם סיסמה חזקה.

**החלטה:** לא מפעילים RLS ב-v1. ה-Scoping Guard (WP-03, ADR-016) הוא נקודת האכיפה היחידה.
**למה:**
1. הגארד כבר חזק ומוכח — `ScopedDb` בלי raw handle, אכיפת lint על ייבוא `getDb`, וחבילת `tests/isolation/` שהיא הגדרת ה-"גמור".
2. RLS על Neon דורש: רול מוגבל שני + connection string שני + עטיפת **כל** פעולת DB ב-transaction שמזריק `set_config` + policy על **כל טבלה** (מס גרסאות + בדיקות תמידי).
3. v1 מטפל יחיד — ממד ה-therapist_id הוא אפס blast-radius; ממד ה-patient_id (הקריטי ל"כלל הזהב") מכוסה מלא ע"י הגארד + בדיקות הבידוד.
4. **הפיך:** ה-hooks קיימים. סקירת אבטחה / מעבר לריבוי-דיירים → מוסיפים רול מוגבל + policies + transaction-wrapping. הסקריפט נשאר לאימות חוזר.

**נדחו:** RLS load-bearing עכשיו — עלות מימוש/תחזוקה גבוהה מול תועלת שולית ב-v1 מטפל-יחיד עם גארד מוכח.

## ADR-018 — Audit Log: auto-audit דרך ה-guard, append-only ב-trigger
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-05**
`modules/core/audit` — טבלת `audit_log` (DATA_MODEL), שירות `recordAudit`/`queryAudit`/`purgeOldAudit`, `server.ts` עם `audit()` (מושך actor+IP מה-session).

**כתיבה אוטומטית:** ל-`ScopedDb` (WP-03) נוסף `ScopedAuditSink` אופציונלי — כל `insert`/`update`/`delete` דרך handle ממוקד פולט אירוע. `getTherapistDb()`/`getPatientDb()` מחווטים אותו ל-`recordAudit`. **אי אפשר לשכוח** — זה יושב בתוך הגארד. זה ה"middleware שמתעד גישה למידע מטופל" שה-DoD מבקש.

**כתיבה מפורשת:** אירועי auth (`audit("login", ...)` ב-login action, `audit("invite", ...)` ב-accept) וקריאות ברמת-מסך (`audit("view", "patient", {patientId})` — ייווסף במסך תיק המטופל ב-WP-11).

**החלטות:**
- **קריאות לא מבוקרות אוטומטית** — audit של כל `findMany` = רעש (טעינת דשבורד = עשרות reads) ופגיעה בביצועים. הבידוד (WP-03) כבר מונע cross-read; audit-של-קריאות נלכד ברמת המסך/endpoint.
- **fail-open** — `recordAudit` תופס שגיאות ולא מפיל את הפעולה הראשית (זמינות > חוסר-audit לאירוע יחיד). לשקילה מחדש בסקירת אבטחה.
- **append-only נאכף ב-DB** — trigger `BEFORE UPDATE OR DELETE` שעושה `RAISE`. `purgeOldAudit` (retention, לא מתוזמן — WP-21) מכבה את ה-trigger ב-transaction כדי לגזום. שמירה: 730 יום.

**נדחו:** audit לכל קריאת DB — רעש/ביצועים. אכיפת append-only ברמת שירות בלבד — פחות חזק מ-trigger.

## ADR-019 — Field Registry: schema סריאלי → Zod, validator יחיד, registry בקוד
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש ADR-004 / WP-09**
`modules/core/fields`.

- **schema סריאלי:** `field_definition.schema` (JSONB, NOT NULL) = descriptor פשוט (`{type:"scale",min:1,max:10}`). `compileFieldSchema()` → Zod validator. descriptor פגום זורק ("אין schema, אין שדה").
- **validator יחיד:** `validateFieldValue(def, value)` — הנקודה היחידה שבודקת `field_value`. `setFieldValues`/`getFieldValues` קוראים לו **בכתיבה ובקריאה** (שורת JSONB מזוייפת/ישנה נתפסת, לא נסמכים עליה).
- **registry בקוד:** `FIELD_REGISTRY` (מערך), `assertRegistryValid()` — קומפילציה של כל schema + ייחודיות key + התאמת type↔schema + כלל ADR-004 מס' 3 (`charted:true` דורש `chartedColumn`). רץ ב-test suite → schema שבור מפיל CI. `loadRegistryInto(db, therapistId)` עושה upsert; `pnpm db:registry` לטעינה מחדש.
- **טבלאות:** `field_definition` (unique על therapist+entity+key), `field_value` (unique על entity+entity_id+definition_id). מיגרציה `0003`.
- **רינדור:** `<FieldInput def name defaultValue>` — פקד לכל type (text/number/scale/boolean/select/date). scale = pill buttons.
- **ללא בונה טפסים גרפי ב-v1** (ADR-004 מס' 4).
- **גישה:** `setFieldValues`/`getFieldValues` מקבלים `Db` + scope מפורש; `core/fields` ב-lint allowlist. שילוב עם ה-scoping guard בזרימות הדומיין (WP-13/18).

**נדחו:** אחסון Zod מסריאל אמיתי (`zod-to-json-schema` וכו') — descriptor ממוקד פשוט ובטוח יותר. metrics עם עמודות אמיתיות — שלב 2 (`metric_entry` כבר מוגדר ב-DATA_MODEL).

## ADR-020 — Email: Resend, fail-open, 4 תבניות RTL
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש ADR-007 / WP-07**
`modules/core/email`.

- **ספק:** Resend (`resend` npm). דומיין `nofar-health.com` (מאומת — בדיקת שליחה חיה הצליחה, id הוחזר). `from` = `EMAIL_FROM` env = "נופר כהן <nofar@nofar-health.com>".
- **fail-open:** `sendEmail` תופס שגיאות, כותב ללוג (`console.error` → נראה ב-Vercel logs), ומחזיר `{ok:false,error}` — **לעולם לא זורק**. `RESEND_API_KEY` חסר → `{ok:false,skipped:true}` + warning (dev בלי מפתח). כשל דוא"ל לא משנה את תגובת הזרימה ולא מפיל אותה.
- **4 תבניות** (`internal/templates.ts`) — עברית RTL, inline styles בלבד (מיילרים מסירים `<style>`): הזמנה · איפוס סיסמה · תזכורת פגישה · שינוי תוכנית. layout משותף (לוגו + footer).
- **פונקציות שליחה מטופסות** ב-`index.ts`: `sendInviteEmail`/`sendPasswordResetEmail`/`sendUpcomingAppointmentEmail`/`sendPlanChangedEmail`. `appUrl()` בונה קישורים מ-`APP_URL` env.
- **חיווט:** `/forgot` action שולח דוא"ל איפוס אמיתי (עדיין לוג dev). הזמנה → WP-10, תזכורת פגישה → WP-12, שינוי תוכנית → WP-14.
- **פתוח:** טבלת `email_log` ב-DB (לא רק console) — מועמד ל-WP-21. **הלקוח:** לאפס את ה-API key (הודבק בצ'אט) + להגדיר `RESEND_API_KEY`/`EMAIL_FROM`/`APP_URL` ב-Vercel env.

## ADR-021 — Notification Center: פיד פר-נמען, badge ב-polling, אימייל לאירועים קריטיים
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-06 / ADR-007**
`modules/core/notifications`.

- **טבלה:** `notification` (recipient_user_id, therapist_id, type, title_he, body_he, link, meta, created_at, read_at, emailed_at). מיגרציה `0004`. אינדקס `(recipient, created_at)`.
- **חוזה:** `notify()` (יצירה + אימייל לאירוע קריטי), `listNotifications`/`unreadCount`/`markRead` — **כולם scoped ל-recipient_user_id** (משתמש רואה/מסמן רק את שלו; נבדק). `server.ts` = `myNotifications`/`myUnreadCount`/`markMineRead` (session נוכחי).
- **badge:** `NotificationBell` (client) ב-`headerSlot` של שני ה-shells. **polling** ל-`GET /api/notifications` כל 30ש' → count + 15 אחרונות. popover עם פיד + "סמן הכל כנקרא". `POST /api/notifications {ids?}` לסימון.
- **מסך מלא:** `/t/alerts` (מטפל) — רשימה מלאה + mark-all (server action + revalidate).
- **אימייל לאירועים קריטיים:** `password_changed`/`appointment_upcoming`/`plan_changed` (או `email:true` מפורש) → `core/email.sendEmail` + חותמת `emailed_at`. **fail-open** — כשל שליחה לא מפיל את ההתראה.
- **טריגרים מחווטים:** קבלת הזמנה → `patient_joined` למטפל (in-app). איפוס סיסמה → `password_changed` למשתמש (in-app + אימייל).
- `core/notifications` + `core/email` נוספו ל-lint allowlist. **נבדק בדפדפן:** מטופל קיבל הזמנה → למטפל נוצרה התראה, מופיעה ב-`/t/alerts` ו-badge = 1.
**נדחו:** websockets/SSE ל-v1 (polling מספיק למטפל יחיד). מחיקת התראות ע"י המשתמש — לא נדרש; retention עם ה-audit ב-WP-21.

## ADR-022 — Patients module: service מקבל TherapistDb, `list()` נוסף ל-ScopedDb
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-10**
`modules/patients` — מודול הדומיין הראשון.

- **schema:** `patient` הורחב (dob/phone/email/address/photo_url/treatment_goal/general_notes/joined_at/updated_at) · `patient_treatment_type` (M2M, unique על patient+type) · `consent` (unique על patient+kind). מיגרציה `0005`.
- **service** (`index.ts`) — `listPatients`/`getPatient`/`createPatient`/`updatePatient`/`setPatientStatus`. **כל פונקציה מקבלת `TherapistDb`** (מ-`getTherapistDb()`), אז הכול scoped + auto-audited. חיפוש: `ilike` על שם/טלפון/דוא"ל + התאמת UUID מדויקת; סינון סטטוס + סוג טיפול (2 שאילתות דרך `findMany`).
- **ScopedDb הורחב:** `list(table, { where?, orderBy?, limit?, offset? })` — למסכי רשימה (ל-`findMany` אין order/pagination). נשאר scoped.
- **timeline:** `modules/patient-file/index.ts` קיבל `recordEvent(scopedDb, {...})` מינימלי — כותב ל-`timeline_event` דרך ה-handle הממוקד. יצירת מטופל → `status_changed` "נוספ/ה למערכת"; שינוי סטטוס → `status_changed` עם הישן←החדש.
- **יצירה:** `createPatient` (DB) → ה-action מוסיף `provisionPatientUser` + `createPatientInvite` + `sendInviteEmail` (אם יש דוא"ל, best-effort).
- **מסכים:** `/t/patients` (רשימה + חיפוש + פילטרים) · `/t/patients/new` · `/t/patients/[id]` (פרופיל + Timeline placeholder + קשר + הסכמות; `audit("view","patient")`) · `/t/patients/[id]/edit`. `PatientForm` משותף.
- **בדיקות:** `tests/isolation/patients-module.test.ts` (5) — מטפל לא רואה/נוגע במטופלי מטפל אחר; createPatient → timeline + audit; שינוי סטטוס → timeline; חיפוש/פילטרים. 63 סה"כ.
- **נבדק בדפדפן מול Neon:** יצירת "דנה פרץ" → redirect לתיק · `/t/audit` הראה create(patient/pt/timeline_event) + view(patient).

**נדחו:** `unsafeQuery` escape hatch — לא נדרש ל-WP-10 (join של סוגי טיפול נעשה ב-2 שאילתות). מחיקת מטופל — anonymize+lock, WP רגולציה.

## ADR-023 — Timeline read side: `listTimeline` scoped, filter-in-query, single index
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-11**
צד הקריאה של ה-Timeline נוסף ל-`modules/patient-file` לצד `recordEvent` הקיים.

- **`listTimeline(db, patientId, filter)` / `countTimeline(...)`** — מקבלים `TherapistDb | PatientDb` (cast ל-`TherapistDb` לקריאת ה-union, כמו `recordEvent`). `TherapistDb` מוסיף `therapist_id`, `PatientDb` מוסיף גם `patient_id` — אף handle לא חוצה tenant גם אם מעבירים `patientId` זר.
- **סינון בשאילתה, לא בזיכרון:** `types[]` → `inArray`, חלון תאריכים → `gte/lte` על `occurred_at`, מיון `desc` (ברירת מחדל) או `asc`. הכול AND-נכנס דרך `ScopedDb.list({ where })`.
- **ביצועים:** אינדקס יחיד קיים `timeline_event_patient_idx` על `(patient_id, occurred_at)` — מכסה את הסינון והמיון. תקרת עמוד 500 (DoD: < 1ש' ל-500). `offset` נתמך לעתיד, אין "load more" ב-v1.
- **תוויות עברית** (`TIMELINE_LABEL`) במודול הדומיין (כמו `STATUS_LABEL` ב-patients); מיפוי אייקונים (`TIMELINE_ICON`) נשאר בשכבת ה-UI.
- **מסך:** `/t/patients/[id]` — כרטיס "ציר זמן" עם צ'יפים לפי סוג (`?ev=<type>`) + `<PatientTimeline>` (רכיב render טהור: קיבוץ לפי יום, "היום"/"אתמול"/תאריך, פס רציף עם בועות אייקון). הכותרת מציגה סה"כ אירועים (לא מסונן).
- **בדיקות:** `tests/isolation/patient-file-timeline.test.ts` (6) — cross-therapist ריק, patient handle רואה רק את עצמו, מיון, סינון סוג, חלון תאריכים, תקרת 500. 69 סה"כ.
- **נבדק בדפדפן מול Neon:** תיק "דנה פרץ" — אירוע "נוספ/ה למערכת" מופיע תחת "היום" עם חותמת שעה; `?ev=appointment` → מצב ריק.

**נדחו:** event bus / תור אירועים — כל מודול קורא `recordEvent` ישירות (ARCHITECTURE §4.3). דפדוף אינסופי / cursor pagination — לא נדרש לנפחי v1.

## ADR-024 — Appointments: agenda-by-week UI, wall-clock times via `Asia/Jerusalem`
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-12**

- **schema:** `appointment` (מיגרציה `0006`) — `therapist_id` + `patient_id` שניהם present, אז השורה נגישה לשני ה-handles הממוקדים. `status` (`scheduled`/`done`/`cancelled`/`no_show`), `treatment_type` (nullable, מ-enum של patients), `gcal_event_id` nullable (שלב 2). אינדקסים `(therapist_id, starts_at)` + `(patient_id, starts_at)`.
- **service** (`modules/appointments`): `listAppointmentRows(db)` — גולמי, לשני ה-scopes; `listAppointments(tdb)` — מוסיף `patientName` (שאילתה שנייה, TherapistDb בלבד — patient לא צריך לראות שם של עצמו וגם לא יכול לשאול את `patient`); `getAppointment(tdb)`; `createAppointment`/`updateAppointment`/`setAppointmentStatus` — מקבלים `TherapistDb`. סינון `from/to/patientId/status` ב-SQL, תקרת 500.
- **Timeline + התראות:** כל mutation → `recordEvent(type:"appointment", occurredAt: startsAt, refId)`; `setAppointmentStatus` מחזיר `patientId` כדי שה-action יתריע. שלושה סוגי notification חדשים (`appointment_scheduled/changed/cancelled`) — **union ב-TS בלבד, ללא מיגרציה** (drizzle `text enum` = עמודת text). לא critical (in-app בלבד ל-v1; אימיילי תזכורת = WP מאוחר). `getPatientUserId` נוסף ל-`core/auth`.
- **זמנים:** `lib/tz.ts` — `CLINIC_TZ = Asia/Jerusalem`. הקלט הוא שעון-קיר (`YYYY-MM-DD` + `HH:MM`) → `fromClinicWallTime` ממיר ל-instant דרך היסט ה-tz באותו רגע; כל הרינדור דרך `clinicDateFmt` עם `timeZone` מפורש. נכון פרט לקיפול DST של שעה — מקובל ל-v1. הוחלט **לא** להביא ספריית tz.
- **מסכים:** `/t/calendar` — יומן שבועי כ-**agenda** (7 ימים, ניווט ‹ היום ›, צ'יפים לפי status), לא רשת גרירה (מחוץ לסקופ v1, לא ב-DoD) · `/t/calendar/new` + `/[id]` (פרטים + כפתורי סטטוס כ-server-action forms) + `/[id]/edit` · `AppointmentForm` משותף · `/p/appointments` — קריאה-בלבד (קרובות/קודמות) דרך `getPatientDb()` · כפתור "פגישה" בתיק המטופל (`?patient=<id>`).
- **בדיקות:** `tests/isolation/appointments-module.test.ts` (6) — מטפל לא רואה/נוגע ביומן של מטפל אחר · patient handle רק את עצמו (גם עם `patientId` זר בפילטר) · create → timeline `appointment` + audit · reschedule/status → timeline · no-op status = אפס event · סינון חלון/סטטוס. 75 סה"כ.
- **נבדק בדפדפן מול Neon:** יצירת פגישה ל"דנה פרץ" (09:00) → agenda + פרטים + timeline "פגישה נקבעה" · מטופל "בדיקה התראה" רואה **רק** את הפגישה שלו (11:00 רפלקסולוגיה) ולא את של דנה · round-trip של tz (11:00 קלט = 11:00 תצוגה).

**נדחו:** רשת יומן אינטראקטיבית (drag/resize) · בדיקת חפיפות זמנים · אימיילי תזכורת · סנכרון Google Calendar — כולם WPs מאוחרים או מחוץ ל-v1.

## ADR-025 — Treatment Sessions: single-flow screen, fields via Registry, `__setActiveDb` test seam
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-13**

- **schema:** `treatment_session` (מיגרציה `0007`) לפי DATA_MODEL — `appointment_id` nullable (`on delete set null`), `date`, `treatment_type`, ושבע עמודות טקסט חופשי (`patient_report`/`complaints`/`changes_since_last`/`treatment_done`/`therapist_notes`/`recommendations`/`next_focus`). dual-scoped (therapist+patient) אף שאין מסך למטופל ב-v1.
- **מדדים פר-תחום:** דרך ה-Field Registry (`entity = 'treatment_session'` — `energy_level`/`sleep_quality`/`weight_kg`, כבר ב-`FIELD_REGISTRY`). הרינדור עם `<FieldInput>` הקיים; ה-action מקודד ערכים לפי `def.type` ומעביר ל-`setFieldValuesIn` (validate-on-write). קריאה דרך `getFieldValuesFrom` (validate-on-read).
- **service** (`modules/sessions`): `listSessions`/`getSession` (מצרף `patientName` + `fields`) / `createSession` / `updateSession` — מקבלים `TherapistDb`. `assertAppointment` מוודא שה-`appointment_id` המקושר שייך לאותו מטפל ולאותו מטופל (guard). `createSession` → `recordEvent(type:"session", occurredAt:date, refId)`; `updateSession` לא כותב אירוע חדש (עריכה, לא מפגש חדש).
- **גבול client/server:** `SESSION_SECTIONS` הועבר ל-`modules/sessions/sections.ts` טהור — `session-form.tsx` (`"use client"`) מייבא משם ולא מ-`index.ts` (שמושך `getDb`→`node:fs` ל-bundle).
- **מסך "זרימה אחת"** (WP-13 core): `/t/sessions/new` — טופס `<form>` יחיד, שלושה חלקים ממוספרים (מצב המטופל/ת → הטיפול שבוצע → המלצות והמשך), המדדים משובצים בחלק הראשון, submit אחד. `/t/sessions/[id]` צפייה + `/[id]/edit`. כניסה מהתיק ("מפגש") ומפרטי פגישה ("תיעוד מפגש", עם `?appointment=`). *שלב "משימות" מה-spec — יחווט כש-Tasks (WP-15) קיים.*
- **`__setActiveDb` (client.ts):** seam לבדיקות — `createTestDb()` מצביע את `getDb()` על ה-PGlite של הבדיקה, כך שה-wrappers הציבוריים שמבוססי `getDb()` (core/fields, core/notifications…) עובדים ב-isolation. `setFieldValuesIn`/`getFieldValuesFrom` הפכו ל-wrappers שמזריקים `getDb()` (במקום re-export גולמי).
- **בדיקות:** `tests/isolation/sessions-module.test.ts` (6) — cross-therapist (list/get/update) · field_value scoped למטפל הבעלים · create → timeline `session` + audit · update מחליף ערכי שדות בלי אירוע חדש · ערך מחוץ לסכימה נדחה · appointment של מטופל אחר נדחה. 81 סה"כ.
- **נבדק בדפדפן מול Neon:** מפגש ל"דנה פרץ" — מדדים (אנרגיה 8 / שינה 7 / משקל 68.4) נשמרו, אומתו, והוצגו · timeline "תיעוד מפגש" (מפגש טיפולי) · `/t/audit`: create(treatment_session) + create(timeline_event) + view(treatment_session).

**נדחו:** מסך מפגש למטופל · חיווט יצירת משימות בתוך הזרימה (עד WP-15) · אירוע Timeline על עריכת מפגש.
