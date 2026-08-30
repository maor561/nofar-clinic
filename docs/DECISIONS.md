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
