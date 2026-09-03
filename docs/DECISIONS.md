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

## ADR-026 — Treatment Plans: append-only versions, content via `plan_version` Registry
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-14**

- **schema:** `treatment_plan` (unique על `patient_id` — תוכנית פעילה אחת) + `treatment_plan_version` (`plan_id`, `version_no`, `note`, `created_by`; unique על `plan_id+version_no`). מיגרציה `0008`. שני הר0-ows נושאים `therapist_id` + `patient_id` כדי ש-`PatientDb` יקרא את הגרסה הנוכחית שלו דרך ה-guard. `treatment_plan.current_version_id` מצביע על הגרסה האחרונה.
- **תוכן מובנה** דרך ה-Field Registry: נוספו 4 הגדרות `entity='plan_version'` ל-`FIELD_REGISTRY` — `nutrition` / `supplements` / `lifestyle` / `goals` (הכול `text`). המבנה **לא מקובע** — ניתן להרחיב/לשנות בלי מיגרציה (CLAUDE.md "לא מקבעים מבנים שלא סופקו סופית"). `pnpm db:registry` הורץ מחדש מול Neon.
- **append-only:** `savePlanVersion` — קריאה ראשונה יוצרת את ה-plan; כל קריאה מוסיפה `version_no+1`, כותבת את ערכי השדות מול **מזהה הגרסה החדש** (unique `entity+entity_id+definition_id` → תמיד insert, גרסאות קודמות אף פעם לא נדרסות), מעדכנת `current_version_id`, ומפילה `timeline_event('plan_changed')`. ה-action מתריע למטופל (`plan_changed` — סוג critical, `notify` גם שולח אימייל).
- **`field_value.value` NOT NULL — תיקון ב-`core/fields/store.ts`:** כתיבה ריקה (`null`/`undefined`/`""`/`[]`) לא כותבת row null (היה קורס 23502) — מוחקת row קיים ולא מוסיפה כלום. `false`/`0` נשמרים כתשובה אמיתית. חל גם על מפגשים (WP-13).
- **מסכים:** `/t/patients/[id]/plan` (תוכנית נוכחית + היסטוריית גרסאות + `audit("view","treatment_plan")`) · `/plan/edit` (טופס שדות-Registry + `<FieldInput>`, מאותחל מהגרסה הנוכחית — עריכה נושאת תוכן קדימה) · `/plan/v/[versionId]` (גרסה היסטורית, קריאה בלבד) · `/p/plan` (מטופל — הגרסה הנוכחית בלבד, דרך `getPatientDb()`). כפתור "תוכנית" בתיק.
- **בדיקות:** `tests/isolation/plans-module.test.ts` (6) — cross-therapist (get/list/write) · מטופל קורא רק את הגרסה הנוכחית שלו · כל save = גרסה חדשה, תוכן קודם נשמר · שני `plan_changed` ב-Timeline · ערך מחוץ לסכימה נדחה · שדה ריק מדולג ומנקה ערך קודם. 87 סה"כ.
- **נבדק בדפדפן מול Neon:** "דנה פרץ" — גרסה 1 (תזונה+יעדים) → גרסה 2 (הוספת תוספים, note) · היסטוריה מציגה 2→1 · גרסה 1 ההיסטורית נשארה בלי התוספים · Timeline: "תוכנית טיפול נוצרה" + "עודכנה — גרסה 2 · <note>".

**נדחו:** מחיקת/שחזור גרסה · diff ויזואלי בין גרסאות · יותר מתוכנית פעילה אחת למטופל · תבנית `plan_version` גרפית (Field Registry code-defined ב-v1).

## ADR-027 — Tasks: dual-scoped, one status action for both roles
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-15**

- **schema:** `task` (מיגרציה `0009`) לפי DATA_MODEL — `title`/`description`/`start_date`/`end_date`/`frequency` (`once`/`daily`/`weekly`/`custom`)/`status` (`open`/`done`)/`completed_at`/`created_by`. dual-scoped (therapist+patient) כדי שהמטופל יקרא ויעדכן סטטוס של המשימות שלו דרך ה-guard.
- **service** (`modules/tasks`): `listTaskRows`(שני scopes) / `listTasks`(TherapistDb, +שם) / `getTask` / `createTask` / `updateTask` / `deleteTask` (TherapistDb) · **`setTaskStatus(db, id, status)` מקבל `TherapistDb | PatientDb`** — המטופל מסמן "בוצע". מחזיר `{patientId, therapistId, title, changed}`. `completed_at` נחתם/מתאפס. אירוע Timeline: `task_created` ביצירה, `task_completed` במעבר ל-done (idempotent — done→done לא כותב כלום; reopen לא כותב אירוע).
- **`labels.ts` טהור:** enums + תוויות עברית ב-`modules/tasks/labels.ts` (ללא server deps) — `schema.ts` וה-`index.ts` מייבאים משם, ורכיבי client מייבאים ישירות מ-`labels` (לא למשוך `getDb`→`node:fs` ל-bundle; כמו WP-13).
- **פעולת סטטוס אחת לשני הצדדים:** `setTaskStatusAction(taskId, status)` ב-`app/(therapist)/.../tasks/actions.ts` משתמשת ב-`getScopedDb()` (מחזיר `TherapistDb|PatientDb`), ומתריעה למטפל (`task_completed`, סוג חדש ב-union) רק כש-`db.role === "patient"` והמשימה עברה ל-done. עמוד המטופל `/p/tasks` מייבא את אותה פעולה.
- **מסכים:** `/t/patients/[id]/tasks` (רשימה פתוחות/בוצעו + toggle + עריכה + מחיקה, `audit("view","task")`) · `/tasks/new` · `/tasks/[taskId]/edit` · `/p/tasks` (מטופל — checkbox server-action, ללא client JS). כפתור "משימות" בתיק · "משימה מהמפגש" במסך המפגש (חיווט שלב המשימות מזרימת WP-13).
- **בדיקות:** `tests/isolation/tasks-module.test.ts` (6) — cross-therapist (list/get/update/delete) · patient handle נוגע רק במשימות שלו (`setTaskStatus` על משימה זרה → `task_not_found`) · create → timeline + audit · מטופל משלים → `completed_at` + `task_completed` (idempotent) · reopen מנקה `completed_at` ללא אירוע · סינון status. 93 סה"כ.
- **נבדק בדפדפן מול Neon:** מטפלת יצרה משימה ל"דנה" (timeline created+completed) · יצרה משימה ל"בדיקה התראה"; המטופל התחבר, ראה **רק** את המשימה שלו, סימן "בוצע" → למטפלת התקבלה התראה "משימה סומנה כבוצעה" ב-`/t/alerts`.

**נדחו:** תזכורות תדירות (daily/weekly) כאירועי לוח בפועל — התדירות היא תווית בלבד ב-v1 · מטופל יוצר/עורך משימה · היסטוריית שינויי סטטוס.

## ADR-028 — Messaging: one thread per patient, poll via router.refresh, read = other party's rows
**תאריך:** 2026-08-30 · **סטטוס:** נעול · **מממש WP-16**

- **schema:** `message_thread` (unique `patient_id` — שיחה אחת למטופל) + `message` (`thread_id`, `sender` (`therapist`/`patient`), `body`, `sent_at`, `read_at`). מיגרציה `0010`. שני הrows נושאים `therapist_id` + `patient_id` — dual-scoped.
- **`read_at` = מתי הצד השני קרא:** `markThreadRead(db, patientId)` מסמן `read_at=now()` על הודעות ב-thread ש-`sender != db.role AND read_at IS NULL`. `unreadCountFor(db)` סופר לפי אותו כלל — למטפלת: על פני כל המטופלים (scope = therapist_id); למטופל: רק ה-thread שלו.
- **service** (`modules/messaging`): `listMessages` / `sendMessage` / `markThreadRead` / `unreadCountFor` — כולם `TherapistDb | PatientDb`. `listThreads(tdb)` = תיבת דואר: thread לכל מטופל + הודעה אחרונה + מונה שלא-נקרא + שם. `sendMessage` יוצר את ה-thread בפעם הראשונה; מטפלת מוגבלת ל-`findOne(patient)` scoped לפני יצירה (`patient_not_found` על מטופל זר); מטופל — ה-guard כופה `patient_id` על ה-insert.
- **polling** (WP-16 "polling"): `<ChatPoller>` (`"use client"`) קורא `router.refresh()` כל 12ש' (20ש' בתיבה) → ה-server component נטען מחדש והודעות חדשות מופיעות. ללא WebSocket/SSE (מספיק למטפלת יחידה). `<ChatComposer>` — `useActionState` + Enter-לשליחה, `router.refresh()` אחרי הצלחה.
- **פעולה אחת לשני הצדדים:** `sendMessageAction(patientId, ...)` ב-`app/(therapist)/t/messages/actions.ts` דרך `getScopedDb()`; `/p/messages` מייבא את אותה פעולה + את `MessageList`/`ChatComposer`. שליחה → `notify(message_received)` לצד השני (in-app; ה-badge של פעמון ההתראות מתעדכן ב-poll הקיים של WP-06).
- **מסכים:** `/t/messages` (תיבה + "התחלת שיחה" עם מטופלים ללא thread) · `/t/messages/[patientId]` (שיחה, `markThreadRead` ברינדור, `audit("view","message_thread")`) · `/p/messages` (שיחה יחידה). בועות מיושרות לפי sender, "נקרא" על הודעה משלי שנקראה.
- **אין אירוע Timeline להודעה בודדת** — צ'אט אינו אבן דרך קלינית; מסך ההודעות הוא משטח נפרד.
- **בדיקות:** `tests/isolation/messaging-module.test.ts` (5) — מטפלת לא קוראת/פותחת שיחה של מטפלת אחרת (`patient_not_found`) · patient handle רק ה-thread שלו · שני הצדדים ל-thread אחד, סדר כרונולוגי · `unread`/`markThreadRead` נוגעים רק בהודעות הצד השני · `listThreads` = הודעה אחרונה + מונה. 98 סה"כ.
- **נבדק בדפדפן מול Neon:** מטפלת→"בדיקה התראה" הודעה; המטופל התחבר, ראה **רק** את השיחה שלו, סימון "נקרא" חזר למטפלת; המטופל השיב → בתיבת המטפלת badge "1" + ההודעה האחרונה. (שליחה בבדיקה בוצעה דרך `form.requestSubmit()` — לחיצה על כפתור קטן ב-automation לא הפעילה submit; הטופס תקין ועובד.)

**נדחו:** WebSocket/SSE · קבצים בהודעות (שלב עתידי, DATA_MODEL) · יותר מ-thread אחד למטופל · הקלדה/typing indicators · אירוע Timeline להודעה.

## ADR-029 — Files: Vercel Blob (private) behind a scoped route; visibility enforced on every read
**תאריך:** 2026-08-31 · **סטטוס:** נעול · **מממש WP-08 + WP-17**

- **`@vercel/blob` v2.8, `access: "private"` בלבד.** אין URL ציבורי לקובץ אף פעם. `core/files`: `putFile(key, body, contentType)` · `getFileStream(key)` (מחזיר `ReadableStream` + `contentType`/`size`, `useCache:false`) · `deleteFile(key)`. אילוצים (`MAX_FILE_BYTES=15MB`, `ALLOWED_MIME`) ב-`core/files/labels.ts` טהור לייבוא מ-client. הדלי `nofar-clinic-blob` (private, IAD1) נוצר וחובר לפרויקט Vercel — `BLOB_READ_WRITE_TOKEN` מוזרק אוטומטית ל-deploy.
- **schema:** `document` (מיגרציה `0011`, dual-scoped) — `name`/`kind` (`lab_result`/`summary`/`referral`/`image`/`form`/`other`)/`file_key`/`mime`/`size`/`uploaded_by` (`therapist`/`patient`)/`visibility` (`therapist_only`/`therapist_and_patient`, ברירת מחדל `therapist_only`).
- **`therapist_only` לא נגיש למטופל בשום נתיב:** `scopedWhere(db, base)` ב-`modules/documents` מוסיף `visibility = therapist_and_patient` כש-`db.role === "patient"` — חל על `listDocuments` ו-`getDocument` כאחד. `createDocument` כופה `visibility = therapist_and_patient` + `uploadedBy = patient` כשמטופל מעלה.
- **נתיב יחיד לבייטים:** `GET /api/documents/[id]` — `getScopedDb()` → `getDocument(db, id)` (null אם scope שגוי או מטופל+`therapist_only`) → `getFileStream` → stream עם `content-disposition: inline; filename*=UTF-8''…` ו-`cache-control: private, no-store`. `audit("view","document")`. ללא session → 401.
- **פעולה אחת לשני הצדדים:** `uploadDocumentAction(patientId, ...)` דרך `getScopedDb()` — key `p/<patientId>/<uuid>_<safeName>` · validate mime+size · `putFile` → `createDocument` → `recordEvent("document_added")` → התראת `document_shared` (סוג חדש, union) לצד השני כשהמסמך משותף. `/p/documents` מייבא את הפעולה + `UploadForm`. `setDocVisibilityAction` / `deleteDocumentAction` — מטפלת בלבד; מחיקה מוחקת גם את ה-blob (best-effort).
- **מסכים:** `/t/patients/[id]/documents` (רשימה + טופס העלאה עם סוג+נראות + toggle נראות + מחיקה) · `/p/documents` (רשימה של הנראים + טופס העלאה, נראות כפויה). כפתור "מסמכים" בתיק.
- **תשתית בדיקות:** `vitest.config` — `testTimeout: 20000` · `hookTimeout: 30000` · `retry: 1` (חבילת ה-auth נגעה מדי פעם ב-5s תחת עומס argon2+PGlite של 16 קבצים במקביל — לא באג, תזמון).
- **בדיקות:** `tests/isolation/documents-module.test.ts` (5, blob מוקד) — cross-therapist (list/get/delete) · מטופל לא רואה `therapist_only` ב-list ו-get · flip ל-`therapist_only` מסתיר שוב · העלאת מטופל = shared + uploadedBy patient · create → `document_added` + audit. 103 סה"כ.
- **נבדק מקומית (ללא token):** העלאה נכשלת בחן ("העלאת הקובץ נכשלה." inline, בלי 500) · `/api/documents/<uuid>` בלי session → 401.
- **נבדק על ה-deploy החי** (שם ה-token מוזרק): העלאת PDF אמיתית לדנה → נשמר ל-Blob פרטי · הורדה דרך `/api/documents/[id]` → 200, `application/pdf`, `content-length` נכון, `content-disposition: inline; filename*=UTF-8''…`, `cache-control: private, no-store`, הגוף מתחיל ב-`%PDF` · toggle נראות משותף↔פנימי · `/p/documents` של מטופל אחר → ריק · **מטופל אחר שמושך את ה-URL של מסמך `therapist_only` → 404** (כלל הזהב).

**נדחו:** קבצים מרובים בהעלאה אחת · thumbnails/preview · `putFromUrl` · צירוף מסמך להודעה (בהמשך) · הצפנת קבצים at-rest מעבר לפרטיות של Blob.

## ADR-030 — Intake questionnaire: thin response row, answers in field_value
**תאריך:** 2026-08-31 · **סטטוס:** נעול · **מממש WP-18**

- **schema:** `questionnaire_response` (מיגרציה `0012`, dual-scoped, unique `patient_id`) — רק מיכל + מצב הגשה (`status` open/submitted, `submitted_at`). **התשובות ב-`field_value`** (`entity='questionnaire'`, `entity_id = response.id`) דרך ה-Field Registry (WP-09) — בדיוק כמו ב-DoD.
- **registry:** נוספו 5 הגדרות `questionnaire` ל-`FIELD_REGISTRY` (main_goal / allergies / meals_per_day / exercise_freq / sleep_hours) לצד 3 הקיימות — 8 שאלות. `pnpm db:registry` הורץ מול Neon.
- **service** (`modules/questionnaires`): `startResponse(pdb)` (יוצר open בביקור ראשון) · `getQuestionnaire(db)` (`TherapistDb | PatientDb` — response + fields; `null` אם לא התחיל) · `submitQuestionnaire(pdb, patientId, answers)` — מטופל בלבד: `setFieldValuesIn` → status `submitted` + `submitted_at` → `recordEvent("questionnaire_submitted")`. re-submit מותר (עדכון + אירוע נוסף).
- **מסכים:** `/p/questionnaire` — טופס `<FieldInput>` per def; אחרי הגשה → תצוגת קריאה (`AnswersList`) + "עריכה ושליחה מחדש" (`?edit=1`) · `/t/patients/[id]/questionnaire` — קריאה בלבד + `audit("view","questionnaire_response")`. פריט nav "שאלון קליטה" ב-patient shell · כפתור "שאלון" בתיק.
- ה-action (`getPatientDb()` ישירות — מטופל בלבד) מתריע למטפל (`questionnaire_submitted`, in-app).
- **בדיקות:** `tests/isolation/questionnaires-module.test.ts` (6) — הגשה נוחתת ב-`field_value` + status + timeline · re-submit = עדכון + אירוע נוסף, response יחיד · ערך מחוץ לסכימה נדחה · מטפל רואה רק את המטופל שלו · `field_value` scoped למטפל הבעלים · patient handle עם id זר כותב רק את ה-response שלו. 109 סה"כ.
- **נבדק בדפדפן מול Neon:** "בדיקה התראה" מילא/ה 6 שדות (scale/number/select/text) → הוגש → תצוגת קריאה · מטפלת רואה ב-`/t/patients/[id]/questionnaire` · התראה "שאלון קליטה מולא" ב-`/t/alerts` · אירוע "שאלון קליטה הוגש" בציר הזמן (סינון "שאלון"). console נקי.

**נדחו:** יותר משאלון אחד · שאלון מותאם למטפל (הגדרות דרך ה-Registry ידנית ב-v1) · חתימה/הסכמה בתוך השאלון (יש `consent` נפרד ב-WP-10) · autosave של טיוטה (submit יחיד).

## ADR-031 — Patient dashboard + profile: read-only aggregation over existing scoped services
**תאריך:** 2026-08-31 · **סטטוס:** נעול · **מממש WP-19**

- **דשבורד `/p`:** מרכיב ארבע קריאות מקבילות דרך `getPatientDb()` — `listAppointmentRows({from:now, status:"scheduled", limit:1})` (הפגישה הבאה) · `listTaskRows({status:"open", limit:4})` · `listTimeline(pdb, me.id, {limit:4})` ("עדכונים אחרונים") · `getQuestionnaire(pdb)` (באנר "שאלון ממתין" אם `!submitted`). אין service/טבלה חדשים — הכול מודולים קיימים שכבר מכוסים בבדיקות בידוד שלהם.
- **פרופיל `/p/profile`:** קריאה בלבד. נוסף `getMyProfile(pdb: PatientDb)` ל-`modules/patients` — `pdb.self()` + `findMany(patient_treatment_type / consent)` דרך ה-guard. עדכון פרטים = "שלחו הודעה לנופר" (אין טופס עריכה למטופל ב-v1 — דוא"ל ההתחברות מסתבך).
- **nav מטופל:** נוספו "שאלון קליטה" ו-"פרופיל" ל-`patient-shell` `DEFAULT_NAV` (8 פריטים). ה-`TopNav` גולש למספר שורות במובייל.
- **בדיקות:** case ל-`getMyProfile` ב-`patient-isolation.test.ts` (מחזיר רק את הפרופיל של הקורא). 110 סה"כ.
- **נבדק בדפדפן מול Neon:** מטופל "בדיקה התראה" — דשבורד מציג "אין פגישה קרובה" (הפגישה שלו כבר עברה), "0 משימות פתוחות", ו-4 עדכונים אחרונים עם אייקונים · פרופיל מציג שם + תאריך הצטרפות + "—" לשדות ריקים · nav מלא (8) · **נבדק responsive** ב-375px — הכרטיסים נערמים, ה-nav גולש. console נקי.

**נדחו:** עריכת פרטי מטופל · widget-ים נוספים (מדדים/גרפים) · התאמה אישית של הדשבורד.

## ADR-032 — Therapist dashboard + dead-nav pages filled
**תאריך:** 2026-08-31 · **סטטוס:** נעול · **מממש WP-20**

- **דשבורד `/t`:** 6 קריאות מקבילות דרך `getTherapistDb()` + `myUnreadCount()` — מטופלים פעילים (`listPatients`) · פגישות היום + קרובות (`listAppointments` from/to, קבוצה לפי `patientId` ל"הבאה"/"אחרונה") · הודעות שלא נקראו (`unreadCountFor(tdb)`) · התראות (`myUnreadCount`) · משימות פתוחות (`listTasks({status:"open"})`, עם שם מטופל). טבלת "מטופלים אחרונים" (6 לפי `joinedAt` desc) עם `StatusPill` + פגישה אחרונה/הבאה. אין service/טבלה חדשים פרט ל-`listRecentDocuments`.
- **`/t/documents`** (פריט nav שהיה 404): `listRecentDocuments(tdb, limit)` — כל המסמכים לפי `created_at` desc + שמות מטופלים. therapist-scoped (בדיקה נוספה).
- **`/t/settings`** (פריט nav שהיה 404): stub קריאה בלבד — שם + תפקיד + רשימת "בקרוב" (שינוי סיסמה / TOTP / מיתוג / רגולציה → WP-21).
- **בדיקות:** case ל-`listRecentDocuments` ב-`documents-module.test.ts` → 111 סה"כ.
- **נבדק בדפדפן מול Neon:** דשבורד "נופר" — 4 מטופלים פעילים · 0 פגישות היום · 5 התראות (מודגש) · "אין פגישות היום" · טבלת מטופלים אחרונים עם סטטוס + פגישה אחרונה (דנה 30/8, בדיקה התראה 31/8) · `/t/documents` מציג את ה-PDF של דנה · `/t/settings` מציג "נופר כהן · מטפלת · מנהלת". **responsive 375px** — rail → top bar, tiles נערמים. console נקי.

**נדחו:** גרפים/מגמות · widget-ים ניתנים לגרירה · פילוח פגישות מתקדם · `/t/settings` פונקציונלי (WP-21).

## ADR-033 — WP-21: נספח רגולציה ותפעול; פערים → WP-23..27
**תאריך:** 2026-08-31 · **סטטוס:** נעול · **מממש WP-21**

נכתב `docs/OPERATIONS.md` — המסמך הסוגר של v1: גיבוי + תרגיל שחזור רבעוני, monitoring, קצב עדכוני
אבטחה (Dependabot), incident response, DPAs + מיקום מידע, מדיניות שמירה (7ש' רשומה / 2ש' audit) מול
מחיקה (anonymize+lock, לא hard-delete), המשכיות ("תיק חירום" מחוץ למערכת), ובדיקת **תיקון 13 לחוק
הגנת הפרטיות** (בתוקף 14.8.2025).

**מסקנות רגולטוריות:**
- חובת הרישום ברשם **בוטלה** בתיקון 13. חלה חובת ניהול/אבטחה — רובה כבר מיושמת (guard, audit
  append-only, argon2id, TOTP, נעילה+throttle, HTTPS, מזעור מידע דרך Field Registry).
- DPO **כנראה לא נדרש** בהיקף מטפלת יחידה — טעון אישור עו״ד לפני פרודקשן.
- **פערים בינוניים לסגירה לפני מטופלים אמיתיים:** Blob באזור ארה״ב (העברה לחו״ל) + פונקציות
  Vercel לא מוצמדות ל-EU → **WP-23**; `totp_secret` ללא הצפנה at-rest → **WP-24**.
- **פערים לא-חוסמים (v1 רק צובר מידע):** retention cron → **WP-25**; anonymize flow → **WP-26**;
  `pg_dump` שבועי אוטומטי → **WP-27**.

**נוסף ל-WORK_PACKAGES:** WP-23..27 בשלב הסגירה, לצד WP-22 (סקירת בידוד סופית) שכבר היה מתוכנן.

**DoD:** המסמך מכסה את כל נושאי ה-spec + checklist פרודקשן + טבלאות "יומן תרגילים"/"סקרי סיכונים"
למילוי. אישור הלקוח + הפיכת פערי-קוד ל-WP — הושלם.

## ADR-034 — WP-22: סקירת בידוד סופית — אפס ממצאים (2 פערי הגנה-בעומק נסגרו)
**תאריך:** 2026-08-31 · **סטטוס:** נעול · **מממש WP-22**

**היקף:** מעבר על כל route/endpoint + שכבת המודולים + הגארד + זרימות ה-auth; הרצת `tests/isolation`
מלאה; probes של זיוף URL/ID/Request על ה-deploy החי כמטופל.

**ממצאים (2) — שניהם בטוחים כפי שנעשה בפועל (כל call-site מאמת דרך הגארד קודם), נסגרו כהגנה בעומק:**

1. **`core/fields.getFieldValues` סינן `therapist_id` בלבד, לא `patient_id`.** מטופל שהיה מעביר
   `entityId` לא-מאומת יכול היה (במערכת עם >1 מטפל) לקרוא `field_value` של מטופל אחר של אותו מטפל.
   **תיקון:** `getFieldValues(db, scope: FieldScope, ...)` — סינון `therapist_id AND patient_id`.
   `getFieldValuesFrom` מקבל `FieldScope`. `setFieldValues` upsert-lookup גם scoped.
   `submitQuestionnaire` כותב עם `response.patientId` (guard-forced), לא עם הארגומנט.

2. **`createSession`/`createAppointment`/`createTask`/`createDocument` לא אימתו ש-`input.patientId`
   שייך ל-scope** לפני כתיבה (בניגוד ל-`savePlanVersion`/`sendMessage` שכבר אימתו).
   **תיקון:** כל אחד עושה `tdb.findOne(patient, eq(id))` scoped → `patient_not_found` אם לא.

**בדיקות:** +3 (`createX` למטופל של מטפל אחר → נדחה) · 2 הודקו (`field_value`: מטפל נכון + מטופל
שגוי → כלום). `tests/isolation/` = 67/67; סה"כ 114.

**probes על ה-deploy החי (כמטופל "בדיקה התראה"):**
| ניסיון | תוצאה |
|--------|-------|
| `GET /t` + כל `/t/*` (דשבורד, תיקי מטופל אחר, יומן, הודעות, audit, מסמכים) | redirect ל-`/login` |
| `GET /api/documents/<מסמך therapist_only של מטופל אחר>` | **404** |
| `GET /api/documents/<uuid אקראי>` | 404 |
| `POST /api/notifications` עם `ids` מזויפים (של המטפלת) | 200, אף רשומה לא סומנה (`markMineRead` AND-נכנס `recipient_user_id = session.userId`) |

**מסקנה:** אפס ממצאי בידוד ניתנים לניצול. הגארד (`ScopedDb`, ADR-016) + lint `no-restricted-imports`
+ route-group layouts (`requireTherapist`/`requirePatient`) + middleware הם 4 שכבות עצמאיות.
מסלולי המטופל ב-URL **חסרי `[id]`** (הכול "me") פרט ל-`/api/documents/[id]` שמוגן ונבדק.

**נותר ל-WP-23** (חוסם פרודקשן): מיקום מידע EU + Blob.

## ADR-035 — WP-23: פונקציות Vercel נכפו ל-`fra1`; Blob EU נותר פעולת לקוח
**תאריך:** 2026-08-31 · **סטטוס:** נעול · **מממש WP-23 (חלק קוד)**

לפני: `x-vercel-id` = `fra1::iad1::…` — הבקשה נכנסת בפרנקפורט אבל **הקוד רץ ב-iad1 (ארה״ב)**.
עיבוד ה-PII (קריאה מ-Neon, טיפול בבקשות) התבצע מחוץ ל-EU.

**תיקון קוד:** `vercel.json` → `{ "regions": ["fra1"] }`. זה ה-lever שה-Next.js build adapter של
Vercel מכבד לכל ה-Serverless Functions. (`preferredRegion` route-segment — deprecated ב-Next 16,
לא בשימוש.) מומלץ ללקוח לוודא גם Dashboard → Functions → Function Region = Frankfurt.

**נותר לפעולת לקוח (לא ניתן בקוד):**
1. **Blob store באזור EU.** אזור נקבע ביצירה ואינו ניתן לשינוי. יש ליצור store חדש (אם Vercel
   מציעה `fra1` ל-Blob) ולעדכן `BLOB_READ_WRITE_TOKEN`; קובץ הבדיקה היחיד (`בדיקת-דם-אוגוסט.pdf`)
   יאבד — זניח. חלופה: S3 תואם בפרנקפורט (`core/files` מופשט מספיק להחלפה).
   **עד אז:** הסכמת `data_transfer_abroad` (מיושמת ב-WP-10) היא הבסיס החוקי הזמני.
2. **גיבוי Blob** — משולב ב-WP-27 (`pg_dump` + list+copy של blobs ליעד מוצפן).

**DoD:** קוד — פונקציות ב-EU ✓. אין מידע מטופל מחוץ ל-EU — **חלקי:** DB ✓, compute ✓, Blob ✗
(פעולת לקוח + הסכמה זמנית).

## ADR-036 — מסך הגדרות: החלפת סיסמה + הרשמת TOTP
**תאריך:** 2026-08-31 · **סטטוס:** נעול

`/t/settings` (היה stub) → מסך אמיתי מעל פונקציות ה-auth הקיימות (WP-02):
- **חשבון:** שם, דוא"ל, סטטוס 2FA.
- **החלפת סיסמה:** `changePasswordAction` → `changePassword(userId, current, next)` (מאמת נוכחית, `passwordSchema` על החדשה).
- **אימות דו־שלבי:** `beginTotpAction` (server) → `beginTotpEnrollment` + `QRCode.toDataURL` על ה-`otpauth://` URI (נוסף `qrcode`); הלקוח מציג QR + מפתח ידני → `confirmTotpAction(secret)` → `confirmTotpEnrollment`. אחרי אישור: `router.refresh()`, ה-badge → "פעיל".
- **נבדק בדפדפן מול Neon:** הרשמת TOTP מלאה — QR (data:image/png 180×180) + מפתח `QZJE…` → קוד תקף חושב מ-`otpauth` → הוגש → "אימות דו־שלבי פעיל". (חשבון ה-seed הוחזר לפ password-only אחרי הבדיקה — המשתמש ירשום עם המכשיר שלו.)
- `getAccountInfo(userId)` נוסף ל-`core/auth` (email + totpEnabled).

**גבול v1:** אין recovery codes — מטפל שאיבד את האפליקציה = לנקות `totp_secret`/`totp_enabled_at` ב-DB (מתועד ב-OPERATIONS §7). recovery codes = שיפור עתידי.

## ADR-037 — מדיניות סיסמה: אורך בלבד (10+), ללא כללי הרכב
**תאריך:** 2026-08-31 · **סטטוס:** נעול · לבקשת הלקוח

`passwordSchema` היה 10+ תווים **+ אות + ספרה**. שונה ל-**10+ תווים בלבד** (מקס' 200). מותר PIN
של ספרות בלבד, ביטוי בעברית בלבד, או שילוב. הנימוק: אורך נושא את האנטרופיה; כפיית מחלקות תווים
דוחפת דווקא לתבניות צפויות. עודכנו רמזי ה-UI (invite / reset / settings) ובדיקת המדיניות.
argon2id, נעילת חשבון, throttle IP, ו-TOTP אופציונלי — ללא שינוי.

## ADR-038 — הסתרת מודול ההודעות (WP-16) מאחורי feature flag
**תאריך:** 2026-08-31 · **סטטוס:** נעול · לבקשת הלקוח

הלקוח ביקש להסיר את אפשרות ההתכתבות מהממשק **בלי למחוק קוד** ("בשלב הזה רק תוריד את האפשרות
לשימוש והסתר אותה"). המימוש:

- **`lib/features.ts` חדש** — אובייקט `FEATURES` עם `messaging: false` (const). דגל יחיד להיפוך.
- **ניווט:** פריט "הודעות" מוסתר בשני ה-shells (`therapist-shell` / `patient-shell`) כשהדגל כבוי.
- **דשבורד מטפל:** אריח "הודעות שלא נקראו" הוסר; ה-grid ירד ל-3 עמודות; `unreadCountFor` כבר לא נקרא.
- **מסלולים:** `/t/messages`, `/t/messages/[patientId]`, `/p/messages` → `notFound()` כשהדגל כבוי (404).
- **Server action:** `sendMessageAction` מחזיר "התכונה אינה זמינה כרגע." כשהדגל כבוי (הגנה בעומק — ה-UI ממילא לא קיים).
- **מה שלא נגע:** `modules/messaging/` על שלמותו, מיגרציה 0010, `message_thread`/`message`, בדיקות הבידוד (`messaging-module.test.ts` — 5, עדיין ירוקות), רכיבי `chat.tsx`/`message-list.tsx`.
- שוכתבו 3 מחרוזות תיאור (מסך auth, empty-state של התראות + ציר זמן) שהזכירו "הודעות" כדוגמה.

**החזרה:** `FEATURES.messaging = true` מחזיר ניווט + מסלולים. אריח הדשבורד — הוספה ידנית (יש הערה בקוד).
114 בדיקות · lint · build — ירוקים. אומת בדפדפן: אין "הודעות" בניווט מטפל/מטופל, `/t/messages` + `/p/messages` → 404.

## ADR-039 — זמינות מטפלת + קביעת תור עצמית למטופל (WP-28 / WP-29)
**תאריך:** 2026-08-31 · **סטטוס:** נעול · לבקשת הלקוח (יומן — חלק א׳)

הלקוח ביקש שמטופל יוכל לקבוע פגישה לפי חלונות הזמן הפנויים. 4 החלטות שנסגרו בדיון: אישור
**אוטומטי** (הפגישה `scheduled` מיד, ללא סטטוס `pending`) · Google Calendar בשלב נפרד (ADR עתידי) ·
טווח החלטות המדיניות ניתן לשיקול המטפלת.

- **מודול `modules/availability/`** — 3 טבלאות therapist-scoped (מיגרציה `0013`):
  `availability_rule` (חלון שבועי חוזר — weekday 0–6, דקות מחצות; unique לכל weekday, חלון אחד ליום ב-v1) ·
  `availability_exception` (תאריך חסום בודד) · `booking_policy` (שורה אחת למטפלת:
  `self_scheduling_enabled` כבוי כברירת מחדל, `slot_minutes`, `granularity_minutes`,
  `lead_hours`, `horizon_days`, `buffer_minutes`).
- **מנוע חלונות `slots.ts`** — פונקציה **טהורה** `computeOpenSlots({rules, blockedDates, busy, policy, from, to, now})`.
  כל חישוב שעון-קיר דרך `lib/tz` (עוגן צהריים ל-DST). מחזירה רשימת instants ל-start.
  ריווח (`buffer`) מכרסם גם מקצוות החלון וגם סביב טווחי busy. leadHours / horizonDays נאכפים.
  9 בדיקות יחידה.
- **כתיבה `bookSelfAppointment(pdb, {startsAt, endsAt})`** ב-`modules/appointments` — insert דרך ה-guard
  (`PatientDb` כופה `patient_id` + `therapist_id`), status `scheduled`, `recordEvent("appointment")`.
- **Server action `bookSlotAction`** (`/p/appointments/new`) — מאמת מחדש את השעה מול `SchedulingView`
  טרי (זמינות + lead + חפיפה עם busy) לפני ה-insert; שעה שנתפסה בינתיים → "השעה כבר לא פנויה".
  אחרי הקביעה: התראה למטפלת (`appointment_scheduled`) + התראת אישור למטופל (`email: true`).
- **מסכים:** `/t/settings/availability` (טוגל, שבעה ימים, מדיניות, תאריכים חסומים) עם קישור מ-`/t/settings` ·
  `/p/appointments/new` (ניווט שבועי, כפתור לכל שעה פנויה, `confirm` לפני קביעה) עם כפתור "קביעת תור חדש"
  ב-`/p/appointments` (מוצג רק כשהטוגל דלוק).
- **מרוץ תפיסה:** re-check אפליקטיבי ב-action מספיק לקליניקה של מטפלת אחת. constraint EXCLUDE ב-Postgres
  (`btree_gist`) — שיפור עתידי (PGlite בבדיקות לא תומך → הושאר בחוץ).

**DoD:** מטפלת מגדירה זמינות ✓ · מטופל רואה חלונות פנויים בלבד (ללא פרטי מטופלים אחרים) ✓ ·
קובע → פגישה ביומן המטפלת + בפגישות שלו + התראה ✓ · שעה שנקבעה נעלמת מהרשת ✓ ·
15 בדיקות (9 מנוע + 6 בידוד) ✓ · נבדק בדפדפן מול Neon מקצה לקצה.
**תלוי:** WP-12, WP-09 · **הבא:** WP-32 (Google Calendar — ממתין ל-OAuth credentials מהלקוח).

## ADR-040 — `SchedulingView`: משטח קריאה צר לקביעה עצמית
**תאריך:** 2026-08-31 · **סטטוס:** נעול

**הבעיה:** מסך הקביעה של המטופל צריך לקרוא את הגדרת הזמינות של המטפלת ואת השעות התפוסות, אבל
`PatientDb` **לא יכול אפילו לנקוב** בטבלה therapist-scoped (הגנת ה-guard), ואסור שמטופל יראה
*מי* קבע שעה — רק *שהיא* תפוסה.

**ההחלטה:** מחלקת קריאה-בלבד `SchedulingView` ב-`modules/core/authz/internal/`, שנחשפת דרך
`getSchedulingView()` ב-`authz/server.ts`. היא מקבלת `therapistId` **מה-session בלבד** (לעולם לא מ-input)
ומספקת שתי פעולות ותו לא:
1. `config()` — `booking_policy` + `availability_rule` + תאריכים חסומים של אותה מטפלת.
2. `busyRanges(from, to)` — `{ start, end }` בלבד של פגישות שאינן מבוטלות. ללא `patient_id`, ללא הערות,
   ללא סוג טיפול. אין נתיב לזליגת PII של מטופל אחר.

הכתיבה (`bookSelfAppointment`) נשארת מאחורי ה-guard המלא. זהו חריג צר ומכוון ל-guard (בדומה ל-
`PatientDb.self()`), מתועד כאן, ולא מרחיב את משטח הכתיבה. `authz/internal` כבר מייבא סכימות דומיין
(`patient` ב-`scoped-db`), כך שכיוון התלות עקבי.

## ADR-041 — Google Calendar: דחיפה חד-כיוונית + free/busy (WP-32)
**תאריך:** 2026-08-31 · **סטטוס:** נעול · לבקשת הלקוח (יומן — חלק ב׳)

4 החלטות מהדיון: **A+B** — דחיפת פגישות Nofar→Google + קריאת "תפוס" מ-Google לתוך מנוע החלונות
(ללא דו-כיווני מלא) · **שם פרטי בלבד** בכותרת האירוע ("פגישה — דנה") + קישור חזרה בתיאור, ללא
הערות קליניות · חיבור חד-פעמי דרך OAuth של המטפלת.

- **מודול `modules/calendar-sync/`** — מודול תשתית (getDb-backed, פטור מ-`no-restricted-imports` כמו
  `core/email`/`core/notifications`). כל פונקציה ציבורית ממופתחת ב-`therapistId` שמגיע תמיד מ-scoped
  handle מאומת (`tdb.therapistId`/`pdb.therapistId`), לעולם לא מ-input.
- **טבלה `calendar_connection`** (מיגרציה `0014`, therapist-scoped, שורה אחת): `refresh_token_enc`
  (**מוצפן AES-256-GCM**, מפתח `CALENDAR_TOKEN_KEY` base64/32B — הטוקן לא יושב אף פעם בבירור ב-DB),
  `calendar_id`, `sync_enabled`, `last_sync_at`, `last_error`.
- **`internal/google.ts`** — לקוח REST כתוב-יד (בלי `googleapis`): authUrl · exchangeCode · refresh →
  access token · insert/patch/delete event · freeBusy. Scopes: `calendar.events` + `calendar.freebusy`.
- **מסלולים:** `GET /api/integrations/google/connect` (therapist, state ב-cookie httpOnly, redirect ל-Google) ·
  `GET /api/integrations/google/callback` (אימות state, `exchangeCode`, שמירה מוצפנת, redirect ל-`/t/settings?google=…`).
- **סנכרון best-effort:** `syncAppointment(therapistId, appt)` נקרא **fire-and-forget** (`void`) מ-4 ה-actions
  (`create`/`update`/`setStatus:cancelled` של המטפלת + `bookSlot` של המטופל). כישלון → `last_error` בלבד,
  לעולם לא מפיל כתיבת פגישה. `gcal_event_id` (עמודה קיימת מ-WP-12) נכתב חזרה על שורת ה-appointment.
- **free/busy:** `googleBusy(therapistId, from, to)` — מוזג ל-`SchedulingView.busyRanges` במסך הקביעה
  ובאימות ה-action. מחזיר `[]` כשלא מחובר / שגיאה.
- **`/t/settings` → כרטיס "יומן Google":** מצב (לא-מוגדר / לא-מחובר / מחובר + `last_error`), כפתור חיבור,
  `disconnectGoogleAction`. באנר לפי `?google=`.
- **פרטיות / DPA:** Google הופך sub-processor. שם פרטי בלבד יוצא (לא שם מלא, לא הערות). מכוסה ע"י
  הסכמת `data_transfer_abroad` (WP-10). → לעדכן `OPERATIONS.md §DPAs` ולהוסיף Google לרשימת המעבדים.

**חסמי לקוח:** (1) OAuth client ב-Google Cloud — Client ID/Secret + הוספת scopes ב-Data Access +
הוספת המטפלת כ-Test user; (2) פרסום האפליקציה ("Publish app") לשימוש קבוע — במצב Testing הטוקן
פג כל 7 ימים; (3) הוספת `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `CALENDAR_TOKEN_KEY`
ל-Vercel env.

**DoD:** קוד + מסלולים + כרטיס הגדרות ✓ · הצפנת טוקן (4 בדיקות) ✓ · degradation חלק ללא env/חיבור
(אומת — הקביעה העצמית עובדת) ✓ · `/api/…/connect` מפנה ל-Google עם client_id/redirect/scopes נכונים
(אומת בדפדפן) · **round-trip חי מול Google — הלקוחה חיברה בהצלחה (2026-09-01).** 133 בדיקות · build ✓.

**תוספת — היכן מוצגות חסימות ה-Google (2026-09-01):** ניסיון ראשון הציג אותן ב-`/t/calendar` (agenda
שבועי). הלקוחה ביקשה **הפוך**: האג'נדה תישאר נקייה (מטופלים בלבד), והחסימות יופיעו במסך **קביעת/עריכת
פגישה** — שם הן מסייעות בבחירת מועד. המימוש הסופי: `/t/calendar/new` ו-`/t/calendar/[id]/edit` שולפים
`googleBusy` ל-45 יום קדימה (`app/(therapist)/t/calendar/google-blocks.ts`, מקובץ ומפורמט לפי יום),
ומעבירים ל-`AppointmentForm`. הטופס (client) עוקב אחרי שדה התאריך ומציג מתחתיו את החסימות של אותו
יום — פאנל קריאה-בלבד עם צ'יפים של טווחי שעות. מוצג רק כשהיומן מחובר (`getConnectionStatus`).
האג'נדה `/t/calendar` הוחזרה למצב הקודם (ללא `googleBusy`). אומת בדפדפן מול היומן המחובר של הלקוחה.

## ADR-042 — מדדי מפגש מנוהלים מההגדרות (WP-60)
**תאריך:** 2026-09-02 · **סטטוס:** נעול · **מרחיב ADR-004 מס' 4 / ADR-019**

הלקוחה ביקשה להוסיף פרמטרי מדידה (לחץ דם, היקף מותניים, מצב רוח…) בלי דילוי מפתח. ADR-004 מס' 4
צפה מראש "הגדרות דרך קוד/seed **או מסך פשוט**" — WP-60 מממש את אופציית המסך הפשוט, בלי לרופף אף
גבול:

- **מסך `/t/settings/fields`** (entity `treatment_session` בלבד). מה שמוגדר בו נשלף אוטומטית ע"י
  `sessionFieldDefs` → מופיע בטופס תיעוד המפגש. אין צורך במיגרציה — `field_definition` כבר קיימת.
- **ה-validator היחיד נשאר הגבול היחיד:** `modules/core/fields/internal/manage.ts` מרכיב את
  ה-`schema` הסריאלי מקלטים מטופסים ומריץ `compileFieldSchema` **לפני** כל כתיבה. descriptor פגום
  זורק — שום שורה לא נכתבת.
- **הגבלות מכוונות:** אין `table` ואין `charted` דרך ה-UI (מדד בגרף דורש מיפוי עמודה אמיתית —
  ADR-004 מס' 3 — שממשק לא יכול להוסיף); **סוג + schema ננעלים עם היצירה** (עריכה = שם / סדר /
  פעיל בלבד), כך ש-`field_value` קיים לא יכול להיפסל ע"י עריכת הגדרה; מחיקה = השבתה בלבד
  (`field_value.definition_id` עם `onDelete: restrict`).
- **שדות מובנים** (`FIELD_REGISTRY`) נשארים מוגדרים-בקוד — המסך יכול לתייג/למיין/להשבית אותם, אבל
  `pnpm db:registry` טוען מחדש את המקור. מסומנים "מובנה" ב-UI.
- **בידוד:** כל פונקציה מקבלת `therapistId` מפורש (כמו `loadRegistry`/`getFieldValues`) ומסננת כל
  שאילתה לפיו. 6 בדיקות בידוד + guardrails (`tests/isolation/field-defs-manage.test.ts`).

**נדחה:** ניהול `questionnaire` / `plan_version` דרך אותו מסך — נשאר לקוד/WP-62 (דיוק השאלון).
הארכיטקטורה של המסך גנרית ל-entity אחר, אם יוחלט בעתיד.

## ADR-043 — שליחת מסמך למספר מטופלים: עותק blob פר-מטופל (WP-63)
**תאריך:** 2026-09-02 · **סטטוס:** נעול

מסך `/t/documents` → "שליחת מסמך למספר מטופלים": קובץ אחד + בחירת N מטופלים → רשומת `document`
נפרדת בתיק כל מטופל (`visibility = therapist_and_patient`, `uploaded_by = therapist`) + אירוע
ציר-זמן + התראת `document_shared`.

**❓ שנפתר — blob משותף מול עותק פר-מטופל:** נבחר **עותק פר-מטופל** (`putFile` נקרא N פעמים,
מפתח `p/<patientId>/<uuid>_<name>` נפרד לכל אחד). כל שורה עצמאית לחלוטין: גישה, audit, ומחיקה
(כולל המחיקה האוטומטית פר-מסמך של WP-64) לא נוגעות באף מטופל אחר. העלות — אחסון כפול לכל נמען —
זניחה למטפלת יחידה עם עשרות מטופלים, וזולה בהרבה מהסיכון של blob משותף שנמחק תחת מטופל אחד.

**בידוד:** `shareDocumentWithPatients(tdb, patientIds, meta, fileKeyFor)` מאמת שכל `patientId` שייך
למטפלת (`inArray` על `patient`) **לפני** כתיבה כלשהי — id זר מבטל את כל האצווה. 2 בדיקות בידוד.

## ADR-044 — מחיקת מסמכים אחרי שנה: לולאת אישור בכניסה, ללא cron (WP-64)
**תאריך:** 2026-09-02 · **סטטוס:** נעול

בקשה #15: מסמך בן שנה → לשאול את המטפלת; "כן"→מחיקה, "לא"→לשאול שוב בעוד 3 חודשים.

- **מנגנון:** עמודה אחת — `document.retention_defer_until` (מיגרציה `0019`). "קבוצת הבדיקה" =
  `created_at < now-365d AND (retention_defer_until IS NULL OR retention_defer_until < now)`. אין
  state machine — השאילתה עצמה היא הרשימה.
- **"שמירה"** → `retention_defer_until = now + 90d` (המסמך יורד מהרשימה וחוזר אליה כעבור 90 יום).
  **"מחיקה"** → `deleteDocument` (row + blob + audit דרך ה-handle ה-scoped).
- **ללא cron.** התוכנית המקורית דיברה על cron (WP-25) שסורק חוצה-דיירים ושולח התראה. מוצר
  **מטפל-יחיד** שנכנס למערכת בקביעות לא צריך את זה, ו-cron חוצה-דיירים היה שובר את גבול ה-scoping
  guard (`getDb()` חסום מחוץ ל-core המהימן). במקום — **בדיקה מקומית ב-handle ה-scoped**:
  `countRetentionReview(tdb)` נקרא ב-`/t` (דשבורד) וב-`/t/documents`, ומראה באנר אזהרה עם קישור
  ל-`/t/documents/review`. אם המוצר יהפוך לרב-מטפלים — להוסיף cron אמיתי שקורא לאותן פונקציות
  per-therapist.
- **❓ שנפתר — להחריג סוגי מסמכים (`lab_result` וכו')?** לא. שום סוג לא מוחרג אוטומטית; המטפלת
  מאשרת כל מחיקה ידנית, והמסך מזכיר שמסמכים רפואיים עשויים להיות כפופים לחובת שמירה — ההחלטה
  באחריותה (עקבי עם גישת "באחריות הלקוחה" של בקשה #14).

**DoD:** עמודה + מיגרציה (הוחל על Neon) · `listRetentionReview`/`countRetentionReview`/`deferRetention` +
`deleteDocument` · מסך `/t/documents/review` (מחיקה/שמירה) · באנר ב-`/t` וב-`/t/documents` ·
3 בדיקות בידוד (רשימה scoped, מחזור defer-and-return, אי-אפשר לדחות מסמך של מטפלת אחרת).

## ADR-045 — PWA להתקנה + Web Push ברקע (WP-65)
**תאריך:** 2026-09-02 · **סטטוס:** נעול

בקשה #1: המערכת תתנהג כאפליקציה (מסך הבית) + התראות מגיעות כ-Push גם כשהאתר סגור.

- **PWA:** `app/manifest.ts` (`/manifest.webmanifest`, `display: standalone`, RTL/he, theme
  `#8aa287`, אייקונים 192/512/maskable שנגזרו מ-`logo-mark.png`). `app/layout.tsx` — `manifest`,
  `appleWebApp`, `viewport.themeColor`. `public/sw.js` — service worker מינימלי (**ללא cache של
  assets ב-v1** — קיים רק בשביל Push): `push` → `showNotification`, `notificationclick` → מיקוד/פתיחת
  ה-URL. נרשם ע"י `<ServiceWorker/>` ב-layout.
- **Web Push:** מודול תשתית חדש `modules/core/push` (getDb-backed, ב-eslint allowlist כמו
  `core/notifications`). טבלה `push_subscription` (מיגרציה `0020`, `endpoint` unique, `p256dh`/`auth`,
  FK ל-`user` עם `onDelete: cascade`). `web-push` (RFC 8291) עם VAPID. `sendPushToUser(userId,
  payload)` — best-effort fan-out לכל המכשירים, 404/410 → גיזום השורה. **מחווט ל-`notify()`** —
  כל התראה קיימת יוצרת גם Push (fire-and-forget, fail-open).
- **מסלולים:** `GET /api/push/vapid` (מפתח ציבורי) · `POST /api/push/subscribe` / `unsubscribe`
  (דורש session). **רכיב `<PushToggle>`** ב-`/t/settings` וב-`/p/profile` — עושה את כל הריקוד
  (הרשאה → `pushManager.subscribe` → POST). מתדרדר בחן: דפדפן לא נתמך / VAPID לא מוגדר / הרשאה
  חסומה → שורת הסבר במקום כפתור.
- **degradation:** בלי `WEB_PUSH_VAPID_*` — `pushConfigured()=false`, `sendPushToUser` הוא no-op,
  הרכיב מראה "לא הוגדר". 5 בדיקות בידוד. אומת בדפדפן: manifest + `/api/push/vapid` + SW נרשם
  ו-activated; מסלול ההרשמה עצמו לא נבדק E2E כי הדפדפן האוטומטי חוסם התראות.

**חסמי לקוח:** להוסיף ל-Vercel env — `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`
(להריץ `node -e "console.log(require('web-push').generateVAPIDKeys())"` פעם אחת), `WEB_PUSH_SUBJECT`
(mailto:). עד אז — הכל עובד חוץ מה-Push עצמו.

## ADR-046 — מחיקת מטופל קשה ובלתי-הפיכה (WP-66) — עוקף את המלצת anonymize+lock
**תאריך:** 2026-09-02 · **סטטוס:** נעול · **עוקף במפורש את `OPERATIONS.md` §מחיקת מידע**

`docs/OPERATIONS.md` ומועצת הביקורת בחרו במכוון ב-**anonymize + lock** (שמירת התוכן הקליני,
גריפת מזהים, נעילת גישה) ולא במחיקה קשה — בגלל חובות שמירת רשומות טיפוליות (עד ~7 שנים) שעשויות
לחול על המטפלת.

**הלקוחה ביקשה במפורש מחיקה קשה בלתי-הפיכה ולקחה על עצמה את האחריות הרגולטורית** (מתועד
בצ'אט, 2026-09-01). **הומלץ לה להיוועץ עם עו״ד** לפני שימוש בפועל, וההמלצה חוזרת בטקסט שעל מסך
המחיקה עצמו.

**מימוש:**
- **`deletePatientCompletely(tdb, id)`** ב-`modules/patients` — (1) מוחק את כל ה-blobs של מסמכי
  המטופל מ-Vercel Blob (שום cascade לא מגיע לשם), (2) `tdb.delete(patient, …)` יחיד, scoped
  ל-`therapist_id` (מטפלת לא יכולה למחוק מטופל של אחרת).
- **מיגרציה `0021`** הוסיפה `ON DELETE CASCADE` ל-`field_value` / `invite` / `user` על
  `patient_id` (קודם בלי FK). כך מחיקת ה-`patient` גוררת גם את ה-login, וממנו `session` /
  `notification` / `push_subscription` / `password_reset`. כל שאר הטבלאות המטופל-scoped כבר היו
  cascade.
- **`audit_log` נשמר בכוונה** — הטבלה append-only עם trigger שחוסם UPDATE/DELETE (מיגרציה 0002).
  הרישום הוא מטא-דאטה בלבד (action/entity/entity_id/therapist/timestamp/ip; ללא תוכן קליני).
  זו תכונת accountability, לא באג. הגארד גם רושם את המחיקה עצמה.
- **UI:** כרטיס "אזור מסוכן" ב-`/t/patients/[id]/edit` — checkbox "אני מבין/ה שסופי" + הקלדת
  השם המלא בדיוק → כפתור נפתח. `deletePatientAction` מאמת שוב את השם בשרת.
- **בדיקה:** `tests/isolation/patient-hard-delete.test.ts` — אחרי מחיקה: 0 שורות בכל טבלה
  (כולל `field_value`/`invite`/`user`/`session`/`notification`/`push_subscription`), blob נמחק,
  המטופל של המטפלת השנייה שלם, אירוע audit מסוג `delete` נרשם, מטפלת אחרת מקבלת `patient_not_found`.

**נדחה:** anonymize+lock (המלצת ה-ops — הלקוחה בחרה אחרת), מחיקה מותרת רק אחרי תום תקופת השמירה
(הלקוחה בחרה ללא תלות ברגולציה, באחריותה).

## ADR-047 — כמה חלונות זמינות באותו יום
**תאריך:** 2026-09-02 · **סטטוס:** נעול · **מרחיב ADR-039**

בקשת הלקוחה: להגדיר יותר מחלון עבודה אחד ליום (למשל ראשון 10:00–14:00 וגם 16:00–20:00).

- מנוע ה-slots (`computeOpenSlots`) **כבר** איטר על כל הכללים ליום (`rulesByDay: Map<weekday, WeeklyRule[]>`) — לא נגע.
- **מיגרציה `0022`** הסירה את האילוץ `availability_rule_therapist_weekday_uq` (היה unique על `therapist_id + weekday`). כעת כמה שורות לאותו יום.
- `normalizeRules` ב-`modules/availability` — במקום לדחות `weekday` כפול, ממיין את חלונות היום ודוחה **חפיפה** (`overlapping_windows`). חלונות שנוגעים (end == next start) מותרים.
- מסך `/t/settings/availability` — רכיב `DayRow` (client) מנהל רשימת חלונות ליום עם "+ הוספת חלון שעות" ו-"הסרת חלון". שדות `d{i}_start` / `d{i}_end` חוזרים, ה-action קורא `fd.getAll`.
- בדיקות: `slots.test.ts` — יום עם שני חלונות; `availability-module.test.ts` — שמירת 2 חלונות + דחיית חפיפה. אומת בדפדפן (שמירה → רענון → שני חלונות ליום ראשון).

## ADR-048 — מאגר שאלונים + שיוך מרובה בהקמת מטופל (WP-67)
**תאריך:** 2026-09-02 · **סטטוס:** נעול · **מרחיב ADR-030, חלק מ-#3 / WP-62**

הלקוחה רצתה מאגר שאלונים (במקום שאלון קליטה יחיד קבוע) ולבחור בהקמת מטופל אילו שאלונים —
**יותר מאחד** — יישלחו אליו.

- **`questionnaire_template`** (therapist-scoped, מיגרציה `0023`): שם + טקסט פתיחה + active + sort.
- **שאלות = `field_definition`** (`entity='questionnaire'`) עם עמודה חדשה `template_id`. כל תשובה
  עדיין עוברת דרך ה-validator היחיד של ה-Field Registry (`compileFieldSchema`/`validateFieldValue`).
  ה-CRUD של השאלות משתמש ב-`createManagedFieldDef`/`updateManagedFieldDef` מ-WP-60 עם פרמטר
  `templateId`.
- **`questionnaire_response` = שורה אחת פר (מטופל, template)** — היא גם השיוך וגם מיכל התשובות.
  העמודה `template_id` נוספה, האילוץ `unique(patient_id)` הוחלף ב-`unique(patient_id, template_id)
  NULLS NOT DISTINCT`. שורה ישנה (`template_id = NULL`) = שאלון הקליטה הגנרי הישן — נשמר וקריא.
- **בידוד:** התשובות (`questionnaire_response` + `field_value`) עוברות תמיד דרך ה-scoping guard.
  **מטא-דאטה של template** (שם, טקסט פתיחה) — קונפיגורציה של המטפלת, לא מידע מטופל — נקראת גולמית
  ב-`modules/questionnaires/internal/template-config.ts` (בדיוק כמו `fieldDefinitionsFor` ב-`core/fields`),
  מסוננת תמיד ב-`therapistId` שהגיע משורת response guard-scoped. רק ה-`internal/` פטור מ-lint.
- **UI:** `/t/settings/questionnaires` (CRUD templates) + `/t/settings/questionnaires/[id]` (טקסט פתיחה
  + CRUD שאלות, אותו דפוס כמו WP-60). טופס הקמת/עריכת מטופל — צ'ק-בוקס "שאלונים לשליחה".
  `/p/questionnaire` → רשימה; `/p/questionnaire/[rid]` → מילוי/צפייה פר-שאלון. `/t/patients/[id]/questionnaire`
  → רשימת כל השאלונים של המטופל + תשובות.
- **seed:** `pnpm db:questionnaires` — 3 השאלונים של נופר מ-Google Forms (נטורופתי / רפלקסולוגיה /
  הסכם טיפולי). idempotent לפי שם. **"גיל" → שדה `date` "תאריך לידה"** בכל מקום.
- **בדיקות:** 9 בדיקות בידוד (templates פר-מטפלת, שיוך idempotent, אי-שיוך template של מטפלת אחרת,
  מילוי/הגשה, cross-tenant על field_value, מטופל לא קורא response של מטופל אחר).

**קשר ל-WP-62:** "טופס הסכם טיפולי" מומש כ-template (טקסט ההסכם = טקסט הפתיחה, אישור סופי = שאלת
boolean חובה). דיוק השאלון (#3) — מכוסה. נוסח מסמך הסכמה עצמאי (`/p/consent` חוסם כניסה) עדיין פתוח.

## ADR-049 — UX מובייל למטופל: ניווט תחתון + onboarding בכניסה ראשונה (WP-68)
**תאריך:** 2026-09-02 · **סטטוס:** נעול

צד המטופל נצרך בעיקר מהטלפון. עד עכשיו: `TopNav` אופקי שנשבר ל-3–4 שורות במובייל.

- **מובייל (`< md` = 768px) — shell כמו אפליקציה:**
  - **סרגל עליון דק** (sticky): לוגו + פעמון התראות + יציאה.
  - **`PatientMobileNav`** (client) — סרגל תחתון קבוע: **בית · פגישות · משימות · שאלונים · עוד**
    (`env(safe-area-inset-bottom)` לאייפון). "עוד" פותח sheet מלמטה עם השאר (התוכנית / המפגשים /
    מסמכים / פרופיל), מתג התראות Push, ויציאה.
  - `main` מקבל `pb-24` במובייל כדי לפנות מקום לסרגל.
- **דסקטופ (`>= md`) — ללא שינוי** (`hidden md:flex` / `md:hidden`).
- **`PatientOnboarding`** (client) — sheet שעולה בכניסה ראשונה **פר-מכשיר** (`localStorage`
  `momentum:onboarded`): (1) הוספה למסך הבית — טקסט לפי `devicePlatform()` (iOS/Android/אחר),
  מוסתר אם כבר `isStandalone()`; (2) הפעלת התראות — כפתור שמריץ `enablePush()` inline. "אחר כך"
  סוגר ומסמן את הדגל. הכול נגיש גם אחר כך מ"עוד" ומהפרופיל.
- **`modules/core/push/subscribe.ts`** — חולץ מ-`push-toggle`: `enablePush` / `disablePush` /
  `currentPushStatus` / `devicePlatform` / `isStandalone`. משמש את הטוגל ואת ה-onboarding, בלי כפילות.
- פורטרט בלבד (החלטת לקוח) — landscape עובד אבל לא ממוטב. אייקון `menu` נוסף לסט. תווית הניווט
  "שאלון קליטה" → "השאלונים שלי".

אומת בדפדפן ב-375px: onboarding sheet עלה, נסגר, לא חזר; סרגל תחתון עם 4+עוד; sheet "עוד" עם השאר
+ יציאה; דסקטופ (1100px) ללא שינוי.

## ADR-050 — יומן אכילה משותף עם משוב מהמטפלת (WP-69)
**תאריך:** 2026-09-02 · **סטטוס:** נעול

הלקוחה ביקשה יומן אכילה. הבהרה: **לא חישוב מאקרו/מנות** — המטופל רושם מה אכל, המטפלת עוברת
וכותבת הערות, ולפי זה מדייקת אותו דרך הכלים הקיימים (משימות, תוכנית).

- **`food_log_day`** (מיגרציה `0024`, dual-scoped, unique על `patient_id + date`): 5 עמודות טקסט
  לארוחות (`wakeup`/`breakfast`/`lunch`/`afternoon`/`evening`), `patient_note`, `therapist_note`
  (+ `therapist_note_at`). שורה אחת ליום — ללא טבלת join.
- **`modules/food-log`:** `getFoodDay` / `listFoodDays` / `saveFoodDay(pdb, date, meals)` /
  `setTherapistNote(tdb, patientId, date, note)` / `countLoggedDays`. `saveFoodDay` מחזיר
  `firstEntry` → אירוע ציר-זמן `food_log` + התראה למטפלת (פעם ראשונה ביום). `setTherapistNote`
  עם תוכן → התראה + מייל למטופל.
- **UI מטופל:** `/p/food` — 5 ארוחות + "הערות שלי" + ניווט בין ימים (‹ ›) + שורת סטטיסטיקה
  ("X/7 השבוע · Y מתוך N החודש") + הערת המטפלת בכרטיס sage כשקיימת.
- **UI מטפלת:** `/t/patients/[id]/food` — רשימת ימים + קריאת הארוחות + textarea למשוב (מוצג
  למטופל) + קישורים מהירים ל"משימה מהיומן" ו"עדכון תוכנית".
- **ניווט מטופל:** "יומן אכילה" נכנס; בסרגל התחתון במובייל הוא מחליף את "שאלונים" (בית · אוכל ·
  משימות · פגישות · עוד), שאלונים עבר ל"עוד".
- טיפוס `food_log` נוסף ל-`timelineEventType` (TS בלבד, ללא מיגרציה). 4 בדיקות בידוד.

אומת בדפדפן מקצה-לקצה: מטופל מילא יום → מטפלת ראתה וכתבה הערה → המטופל ראה את ההערה ב-sage card.

## ADR-051 — הגדלת טיפוגרפיה, אייקונים ופקדים ברספונסיביות של טלפון
**תאריך:** 2026-09-03 · **סטטוס:** נעול

הלקוח: "ברספונסיביות של הטלפון תגדיל את הכתב ואת האייקונים והצ'קבוקסים — הכל קטן מדי."
העיצוב היה Desktop-first וצפוף; במסך טלפון זה קטן לקריאה ולנגיעה.

**עיקרון:** התיקון תחום ל-`< 768px` בלבד. דסקטופ ללא שינוי — כל באמפ עוטף ב-`md:`
שמחזיר לערך המקורי.

- **`app/globals.css`** — `@media (max-width: 767px)`: `html { font-size: 17.5px }`
  (כל יחידות ה-rem גדלות ~9%) + `input,textarea,select { font-size: 16px }` כדי
  ש-iOS לא יזום ב-focus.
- **`components/ui/checkbox.tsx`** — `size-4` → `size-5 md:size-4` (16→20px),
  `after:` פסאודו מרחיב את שטח הנגיעה מעל 44px.
- **`components/ui/button.tsx`** — גבהים: `default` 32→40, `sm` 28→36 (+טקסט
  ואייקון), `lg` 36→44, `icon` 32→36 — כולם עם `md:` שמחזיר.
- **`components/ui/input.tsx`** — `h-8` → `h-10 md:h-8`.
- **`patient-mobile-nav.tsx`** — טאבים תחתונים ו"עוד" ~44→52px, אייקונים 21→24,
  שורות ה-sheet `min-h-12` + `text-[15px]` + אייקון 22.
- **`notification-bell.tsx` / `logout-button.tsx`** — שטח נגיעה 32→36 (`size-9
  md:size-8`), הזכוכית 18→20 (`md:size-[18px]`).
- **מסכי `app/(patient)/**`** — אייקוני שורה/מטא 13–15 → 16, תוויות `text-[11px]`
  → `text-xs`, `text-[12px]` → `text-[13px]` (sed).

אומת בדפדפן ב-375px: סרגל תחתון, צ'קבוקסים (22px נמדד), כפתור "שליחת השאלון" (44px),
וגוף הטקסט — כולם בגודל נוח. דסקטופ ב-1280px ללא שינוי. typecheck + lint + 174 בדיקות
+ build ירוקים.

## ADR-052 — דאשבורד KPI חכם במסך הבית של המטופל
**תאריך:** 2026-09-03 · **סטטוס:** נעול

הלקוח ביקש "דאשבורד חכם" במובייל עם מדדים במבט אחד (טיפולים 8/10, משימות פתוחות).
מוקאפ הוצג ואושר. בבחירת הלקוח: 4 האריחים, גם בדסקטופ, כולל שורת "חכם".

- **`app/(patient)/p/patient-kpis.tsx`** — קומפוננטת תצוגה. רשת `grid-cols-2
  md:grid-cols-4`. כל אריח הוא `<Link>` למסך שלו:
  - **טיפולים בסדרה** — `usedCount/sessionCount` + פס התקדמות + "נותרו N"
    (מ-`getActivePatientSeries`). ריק → "אין סדרה פעילה".
  - **משימות פתוחות** — ספירה; רקע בלאש כשיש משימה להיום/באיחור,
    תת-תווית אדומה לאיחור.
  - **הפגישה הבאה** — "היום"/"מחר"/"עוד N ימים" + יום·שעה·תחום.
  - **יומן אכילה** — כמה ימים עודכנו השבוע `/7` + רצועת 7 נקודות + חיווי
    "עודכן/לא עודכן היום" (`countLoggedDays`).
- **שורת "חכם"** — `SmartPrompt` נבחר ב-`page.tsx` לפי עדיפות אחת: משימות
  באיחור → סדרה עם ≤2 טיפולים → משימות להיום → יומן אכילה שלא עודכן היום →
  `null` (לא מוצגת). טקסט + צ'יפ פעולה יחיד.
- **`page.tsx`** — הרשת מחליפה את שלושת כרטיסי הסטטוס הנפרדים (סדרה / פגישה
  באה / משימות פתוחות). באנר השאלון וכרטיס "עדכונים אחרונים" נשארו. נוסף
  שליפת ספירות תאריך-יעד למשימות + ספירות יומן אכילה (שבוע + היום).

typecheck + lint + 174 בדיקות + build ✓. אומת בדפדפן ב-375px (רשת 2×2 + שורה
חכמה) וב-1280px (4 בשורה). מצבי ה"ריק" נבדקו על חשבון הבדיקה.
