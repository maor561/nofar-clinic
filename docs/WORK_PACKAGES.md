# WORK PACKAGES

**עודכן:** 2026-08-29 · סטטוסים: ⬜ לא התחיל · 🟡 בעבודה · ✅ גמור · ⛔ חסום

לכל חבילה: אחריות · תלויות · הגדרת "גמור" (DoD). מודול לא נחשב גמור בלי בדיקת בידוד (אם נוגע במידע מטופל).

---

## שלב 0 — עיצוב ותשתית

### WP-00 · Scaffold + CI ⬜
Next.js App Router, TypeScript, Tailwind + shadcn/ui RTL, ESLint/Prettier, Vitest, GitHub Actions (lint + test + build), ניהול env, מבנה `/modules`.
**DoD:** `pnpm dev` עולה, CI ירוק על PR ריק, RTL עובד ב-shell, מבנה תיקיות תואם `ARCHITECTURE.md`.
**תלוי:** —

### WP-D1 · מוקאפים — מסכים מרכזיים ⬜ ← **הבא בתור**
מוקאפים אינטראקטיביים (Artifacts) בשפת Calm Wellness, Desktop-first, לאישור לפני קוד.
מסכים: (1) דשבורד מטפל · (2) רשימת מטופלים · (3) תיק מטופל + Timeline · (4) מסך פגישה טיפולית · (5) עורך תוכנית טיפול · (6) דשבורד מטופל · (7) שאלון קליטה (מטופל) · (8) התחברות + הזמנה.
**DoD:** 8 מסכים מאושרים ע"י הלקוח; פלטת צבעים, טיפוגרפיה, רכיבי יסוד, ופריסת ניווט נגזרים מהם ומתועדים ב-`design-system`.
**תלוי:** —

### WP-01 · Design System ⬜
מימוש הרכיבים מ-WP-D1: theme tokens (Calm Wellness), typography, כפתורים/שדות/כרטיסים/טבלאות/מודאלים/טוסטים, פריסות (shell מטפל, shell מטופל), מצבי ריק/טעינה/שגיאה, RTL מלא.
**DoD:** Storybook/דף demo עם כל הרכיבים; עובר בדיקת ניגודיות; שני ה-shells עומדים.
**תלוי:** WP-00, WP-D1

---

## שלב 1 — Core

### WP-02 · Auth + Session ⬜
Auth.js credentials, session ב-DB, הרשמת מטפל, הזמנת מטופל (magic-link בלחיצה אחת), איפוס+שינוי סיסמה, TOTP למטפל, נעילת חשבון + rate-limit, logout.
**DoD:** מטפל ומטופל מתחברים; הזמנה→הגדרת סיסמה עובדת; TOTP אכיף למטפל; ניסיונות כושלים ננעלים; בדיקות לזרימת איפוס (חור בידוד קלאסי).
**תלוי:** WP-00, WP-01

### WP-03 · Authorization — Scoping Guard ⬜ 🔑
נקודת האכיפה היחידה: אי אפשר לקבל DB access בלי scope (`therapist_id`, ובצד מטופל `patient_id`). עוטף server actions, route handlers, RSC loaders, cron, webhooks. RBAC (`therapist`/`patient`).
**DoD:** אין נתיב לקבל query ל-DB בלי scope (נאכף בבדיקת lint/type + runtime); חבילת `tests/isolation` בסיסית (2 טבלאות) ירוקה ב-CI; ניסיון עקיפה נכשל בבדיקה.
**תלוי:** WP-02

### WP-04 · Data Layer + RLS spike ✅
Drizzle + Neon (postgres.js, פרנקפורט). `client.ts` בוחר driver לפי `DATABASE_URL` (Postgres / PGlite-memory לבדיקות / PGlite-file לוקאלי).
`db:migrate` דרך חיבור unpooled, seed רץ מול Neon. **Spike:** `rls-spike.ts` — `SET LOCAL` בתוך txn עובד דרך ה-pooler, אבל `neondb_owner` הוא `BYPASSRLS`.
**החלטה (ADR-017):** RLS נדחה; ה-Scoping Guard (WP-03) הוא האכיפה היחידה ל-v1. hooks ל-RLS קיימים אם נדרש בהמשך.
**DoD:** סכמה מיגרייטת ל-Neon ✓ · seed (מטפל + 2 מטופלים) ✓ · החלטת RLS מתועדת (ADR-017) ✓ · התחברות נבדקה מקומית מול Neon ✓.
**תלוי:** WP-03 · **הבא:** WP-05 (Audit Log)

### WP-05 · Audit Log ✅
`core/audit` (ADR-018): `audit_log` + trigger append-only (migration 0002) · `recordAudit`/`queryAudit`/`purgeOldAudit` · `server.ts` `audit()` ·
**auto-audit** ב-`ScopedDb` (כל write ממוקד → אירוע, לא ניתן לשכוח) · `audit("login"/"invite")` בזרימות auth · מסך `/t/audit` עם 3 פילטרים (מטופל/תאריך/פעולה).
**DoD:** CRUD על מידע מטופל → רשומה ✓ · מסך מסונן ✓ · append-only נאכף (trigger + בדיקה) ✓ · 7 בדיקות · נבדק בדפדפן (login → רשומה במסך).
**תלוי:** WP-04 · **הבא:** WP-07 (Email) — WP-06 (Notifications) תלוי בו.

### WP-06 · Notification Center ✅
`core/notifications` (ADR-021): טבלת `notification` (מיגרציה 0004) · `notify()`/`listNotifications`/`unreadCount`/`markRead` — scoped ל-recipient (נבדק) · `server.ts` session-helpers ·
`NotificationBell` (polling 30ש' → `/api/notifications`, popover, mark-all) בשני ה-shells · מסך `/t/alerts` · אימייל לאירועים קריטיים + `emailed_at` (fail-open) ·
טריגרים: קבלת הזמנה→`patient_joined` למטפל · איפוס סיסמה→`password_changed` למשתמש (+אימייל) · 4 בדיקות · נבדק בדפדפן.
**DoD:** התראה נוצרת+נצפית לשני התפקידים ✓ · אירוע קריטי שולח אימייל ✓ · polling מרענן badge ✓.
**תלוי:** WP-04, WP-07

### WP-07 · Email ✅
`core/email` (ADR-020): Resend · fail-open `sendEmail` (לוג + `{ok,error}`, לא זורק; בלי מפתח → skipped) · 4 תבניות RTL עברית (הזמנה/איפוס/תזכורת פגישה/שינוי תוכנית) · `send*Email` מטופסות + `appUrl()` ·
`/forgot` שולח דוא"ל אמיתי · דומיין `nofar-health.com` **מאומת** (בדיקת שליחה חיה ✓). 3 בדיקות · `pnpm tsx .../send-test-email.ts`.
**DoD:** 4 תבניות נשלחות RTL ✓ · כשל נרשם ולא מפיל ✓. **פתוח:** לקוח מגדיר env ב-Vercel + מאפס key.
**תלוי:** WP-00

### WP-08 · File Storage ⬜
`core/files`: העלאה/הורדה חתומה, הרשאה פר-מסמך, מגבלות סוג/גודל.
**DoD:** העלאה+הורדה עובדות; קובץ לא נגיש בלי scope + visibility; URL חתום פג-תוקף.
**תלוי:** WP-03

### WP-09 · Field Registry ✅ 🔑
`core/fields` (ADR-019): `field_definition`/`field_value` (מיגרציה 0003) · `FieldSchema` סריאלי + `compileFieldSchema`→Zod · **validator יחיד** `validateFieldValue` (כתיבה+קריאה) ·
`FIELD_REGISTRY` בקוד + `assertRegistryValid` (רץ כבדיקה → schema שבור מפיל CI; charted בלי column זורק) · `loadRegistryInto` + `pnpm db:registry` · `<FieldInput>` (6 סוגים) ·
**DoD:** schema פגום → `compileFieldSchema` זורק ✓ · I/O מחוץ ל-validator נכשל (14 בדיקות) ✓ · `charted=true` בלי mapping → שגיאה ✓.
**תלוי:** WP-04 · **הבא:** WP-07 (Email, חסום על הלקוח) או WP-10 (Patients).

---

## שלב 1 — מודולי דומיין

### WP-10 · Patients ⬜
CRUD, חיפוש (שם/טלפון/email/מזהה), סינון, סטטוס, פרופיל, סוגי טיפול, הסכמות.
**DoD:** מטפל מנהל מטופל מקצה לקצה; חיפוש למטפל בלבד; `tests/isolation` לכל endpoint; פעולות ב-Audit + Timeline.
**תלוי:** WP-03, WP-05, WP-09

### WP-11 · Patient File + Timeline ⬜
מסך תיק (פרופיל + Timeline), `patientFile.recordEvent()`, סינון Timeline.
**DoD:** אירועים מכל מודול v1 מופיעים; טעינה < 1ש' ל-500 אירועים; בדיקת בידוד.
**תלוי:** WP-10

### WP-12 · Appointments (יומן פנימי) ⬜
יצירה/שינוי/ביטול/תצוגת יומן, קישור למטופל, מצב `no_show`.
**DoD:** מטפל מנהל יומן; מטופל רואה את הפגישות שלו בלבד; אירוע Timeline + התראה; בדיקת בידוד.
**תלוי:** WP-10

### WP-13 · Treatment Sessions ⬜
מסך פגישה כ**זרימה אחת** (לא תיבות מנותקות): מצב מטופל → טיפול → המלצות → משימות → המשך. שדות פר-תחום דרך WP-09.
**DoD:** תיעוד פגישה מלא; מקושר ל-appointment אופציונלי; אירוע Timeline; בדיקת בידוד.
**תלוי:** WP-11, WP-09

### WP-14 · Treatment Plans + גרסאות ⬜
תוכנית פעילה + היסטוריית גרסאות; שינוי = גרסה חדשה + Timeline + התראה; המטופל רואה נוכחית.
**DoD:** גרסאות נשמרות ונצפות; הוספה מאוחרת = אירוע חדש, לא דריסה; בדיקת בידוד.
**תלוי:** WP-11, WP-09

### WP-15 · Tasks ⬜
יצירת משימה (שם/תיאור/תאריכים/תדירות), המטופל מסמן בוצע/לא בוצע.
**DoD:** מטפל יוצר, מטופל מעדכן סטטוס; אירועי Timeline; התראות; בדיקת בידוד.
**תלוי:** WP-11

### WP-16 · Messaging ⬜
שיחה מטפל↔מטופל, polling, נקרא/לא נקרא, היסטוריה.
**DoD:** שני הצדדים מתכתבים; badge מתעדכן; שרשור מבודד למטופל; בדיקת בידוד.
**תלוי:** WP-06

### WP-17 · Documents ⬜
UI מעל WP-08: העלאה ע"י מטפל/מטופל, visibility, רשימה בתיק.
**DoD:** הערה פנימית (`therapist_only`) לא נגישה למטופל בשום נתיב; אירוע Timeline; בדיקת בידוד.
**תלוי:** WP-08, WP-11

### WP-18 · Questionnaire — שאלון קליטה ⬜
שאלון אחד בנוי על WP-09, המטופל ממלא בקליטה, המטפל צופה, אירוע Timeline + התראה.
**DoD:** מילוי מקצה לקצה; תשובות ב-`field_value`; בדיקת בידוד.
**תלוי:** WP-09, WP-11

### WP-19 · Patient App Shell + Dashboard ⬜
ניווט מטופל (דשבורד / התוכנית שלי / המשימות שלי / הפגישות שלי / הודעות / מסמכים / פרופיל), דשבורד: פגישה הבאה, משימות פתוחות, עדכון אחרון מהמטפל.
**DoD:** מטופל רואה רק את שלו בכל מסך; ריצת `tests/isolation` מלאה ירוקה; responsive נבדק.
**תלוי:** WP-11..WP-18

### WP-20 · Therapist App Shell + Dashboard ⬜
ניווט מטפל (Dashboard / מטופלים / יומן / הודעות / התראות / מסמכים / הגדרות), דשבורד: מטופלים פעילים, פגישות היום/קרובות, הודעות שלא נקראו, התראות, משימות.
**DoD:** דשבורד מציג נתונים חיים; מטופלים אחרונים עם פגישה אחרונה/הבאה/סטטוס; responsive.
**תלוי:** WP-10..WP-12

---

## שלב 1 — סגירה

### WP-21 · נספח רגולציה ותפעול ⬜
עמוד: גיבוי + תרגיל שחזור, monitoring, קצב עדכוני אבטחה, צעדי תגובה לאירוע אבטחה, DPAs (Vercel/Neon/דוא"ל), מדיניות שמירה מול מחיקה (anonymize+lock), תוכנית המשכיות אם המטפל מושבת, בדיקת חובת רישום מאגר מידע (תיקון 2025).
**DoD:** הלקוח קרא ואישר; פעולות שדורשות מימוש הפכו ל-WP.
**תלוי:** WP-04

### WP-22 · חומרת בידוד — סקירה סופית ⬜
מעבר על כל endpoint, סקירת אבטחה (`/security-review`), הרצת `tests/isolation` מלאה, בדיקת זיוף URL/ID/Request ידנית.
**DoD:** אפס ממצאי בידוד; דוח חתום ב-`STATUS.md`.
**תלוי:** כל v1

---

## שלב 2 (רק כותרות)

WP-30 מדדים + הזנה יומית · WP-31 תזונה · WP-32 Google Calendar sync · WP-33 מנוע שאלונים מלא · WP-34 תבניות טיפול · WP-35 גרפים ומגמות · WP-36 2FA למטופל.
