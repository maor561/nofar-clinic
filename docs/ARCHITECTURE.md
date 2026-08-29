# ARCHITECTURE

**עודכן:** 2026-08-29 · מלווה את `DECISIONS.md` (ADR-001..013).

---

## 1. סטאק

| שכבה | בחירה |
|------|-------|
| Frontend + Backend | Next.js App Router (RSC + server actions + route handlers) |
| אירוח | Vercel (preview deployments, CI) |
| DB | Postgres — Vercel Marketplace / Neon, אזור פרנקפורט |
| ORM / DB access | Drizzle (מומלץ — טיפוסים, מיגרציות מפורשות, שליטה ב-SQL ל-RLS). *לאישור ב-WP-04.* |
| אימות | Auth.js self-hosted, credentials provider, session ב-DB; TOTP למטפל |
| UI | Tailwind + shadcn/ui מותאם RTL; שפה ויזואלית Calm Wellness |
| קבצים | Blob storage פרטי (Vercel Blob או S3 תואם) + הרשאה פר-מסמך |
| דוא"ל | ספק טרנזקציוני (מומלץ Resend) — לאישור |
| ולידציה | Zod — משותף client/server, וגם סכימות ה-Field Registry |

## 2. מודל שכבות

```
UI (RSC + Client Components)
  ↓ קורא ל-
Module Services  ── חוזה ציבורי לכל מודול (פונקציות מטופסות)
  ↓ עוברות דרך
Scoping Guard  ── מזריק/מאמת scope: therapist_id + (בצד מטופל) patient_id
  ↓
Data Access (Drizzle)  ── + Postgres RLS כהגנה בעומק
  ↓
Postgres
```

חוצה-שכבתי: **Audit Log**, **Notification Center**, **Field Registry validator** — שירותים שכל מודול קורא להם.

## 3. חלוקה למודולים

### Core (משתנה נדיר — "hard to change")
| מודול | אחריות |
|-------|--------|
| `core/scaffold` | הקמת פרויקט, tooling, CI, ניהול env |
| `core/design-system` | רכיבי UI, RTL, theme, פריסות בסיס |
| `core/auth` | הרשמה/כניסה/יציאה, איפוס+שינוי סיסמה, TOTP, ניהול session, נעילה, rate-limit |
| `core/authz` | **scoping guard** — RBAC + הזרקת scope; נקודת האכיפה היחידה לבידוד |
| `core/data` | חיבור DB, Drizzle, מיגרציות, מדיניות RLS, seed |
| `core/audit` | כתיבת/שאילתת Audit Log |
| `core/notifications` | מרכז התראות + שילוב דוא"ל |
| `core/files` | העלאה/הורדה, הרשאה פר-מסמך, סריקה (hook עתידי) |
| `core/fields` | Field Registry: הגדרות שדה, סכמות Zod, validator יחיד ל-JSONB |
| `core/email` | שליחת דוא"ל טרנזקציוני, תבניות, fallback |

### מודולי דומיין — v1
| מודול | אחריות | תלוי ב |
|-------|--------|--------|
| `patients` | CRUD, חיפוש, סינון, סטטוס, פרופיל, סוגי טיפול | core/* |
| `patient-file` | תצוגת תיק + **Timeline** (טבלת `timeline_events` append-only, ללא CQRS) | patients |
| `sessions` | פגישה טיפולית: פרטים / מצב מטופל / טיפול / המלצות; שדות פר-תחום דרך `core/fields` | patient-file |
| `appointments` | יומן פנימי: יצירה/שינוי/ביטול/תצוגה, מקושר למטופל | patients |
| `messaging` | שיחה מטפל↔מטופל, polling (בלי websockets ב-v1) | core/notifications |
| `documents` | UI מעל `core/files` + הרשאות צפייה (מטפל / מטפל+מטופל) | core/files |
| `tasks` | משימות למטופל: שם/תיאור/תאריכים/תדירות/סטטוס | patient-file |
| `plans` | תוכנית טיפול + **היסטוריית גרסאות** (הוספה מאוחרת = אירוע Timeline, לא דריסה) | patient-file |
| `questionnaires` | שאלון קליטה אחד, בנוי על `core/fields` | core/fields |

### מודולי דומיין — שלב 2+
`metrics` (מדדים + הזנה יומית של המטופל, עמודות אמיתיות למדדים בגרף) · `nutrition` · `gcal-sync` · מנוע שאלונים מלא · תבניות טיפול.

### App Shells
`app/(therapist)` ו-`app/(patient)` — כל אחד צורך את ה-service contracts. אין שיתוף מסכים; שיתוף רכיבים דרך `core/design-system`.

## 4. חוקי מודולריות

1. מודול חושף `index.ts` עם פונקציות service מטופסות בלבד. **אסור** לייבא נתיב פנימי של מודול אחר.
2. מודול לא כותב לטבלאות של מודול אחר — קורא ל-service שלו.
3. Timeline נבנה כך: מודול שמייצר אירוע קורא ל-`patientFile.recordEvent(...)`. אין event bus — קריאת פונקציה ישירה.
4. גבולות קשיחים (עם בדיקות אכיפה) רק סביב: `core/authz` (ה-guard) ו-`core/fields` (ה-validator). שאר הגבולות — קונבנציה.
5. שינוי חוזה service = עדכון `WORK_PACKAGES.md` + בדיקה שכל הצרכנים עדכניים.

## 5. אסטרטגיית בידוד מידע (הדרישה הקריטית)

- **Guard ראשי:** אין דרך לקבל client/query ל-DB בלי לעבור דרך `core/authz` שמזריק `therapist_id` ובצד המטופל גם `patient_id`. כל server action / route handler / RSC loader / cron / webhook — דרכו.
- **RLS בעומק:** policies לפי `therapist_id` + `patient_id` מתוך `set_config`. **spike חובה** לפני הסתמכות (transaction-mode pooler ב-Neon).
- **בדיקות:** `tests/isolation/` — לכל endpoint ומזהה, session של מטופל B מצפה 403/404 מול נתוני מטופל A. רץ ב-CI ובכל סשן. אין endpoint חדש בלי בדיקת בידוד.
- **URL/ID:** מזהים אטומים (uuid/nanoid), לא רצים. גישה תמיד מסוננת ב-scope, לא רק "נמצא לפי id".
- **Audit:** כל קריאה/כתיבה למידע מטופל נרשמת (מי, מה, מתי, מטופל).

## 6. מבנה תיקיות (טיוטה)

```
/app
  /(therapist)/...        מסכי מטפל
  /(patient)/...          מסכי מטופל
  /api/...                route handlers (webhooks, מה שלא server action)
/modules
  /core/{scaffold,design-system,auth,authz,data,audit,notifications,files,fields,email}
  /{patients,patient-file,sessions,appointments,messaging,documents,tasks,plans,questionnaires}
    index.ts             חוזה ה-service הציבורי
    /internal            מימוש — אסור לייבא מבחוץ
    /schema.ts           טבלאות Drizzle של המודול
/lib                     עזרי בסיס (ללא לוגיקה עסקית)
/tests/isolation         חבילת בדיקות cross-tenant
/docs                    מסמכי קונטקסט
```

## 7. קונבנציות

- **שפה:** קוד ותגובות באנגלית; טקסטים למשתמש בעברית, מרוכזים ב-`lib/strings.ts` (מפתח → מחרוזת).
- **טיפוסים:** אין `any`. סכימות Zod הן מקור האמת; טיפוסי TS נגזרים מהן.
- **תאריכים:** אחסון UTC; תצוגה בזמן ישראל, פורמט עברי.
- **מזהים:** uuid v4 או nanoid, אטומים.
- **שגיאות:** מודול מחזיר `Result` מטופס (לא זורק) לזרימות צפויות; זורק רק על bug.
- **מיגרציות:** מפורשות, ב-`modules/core/data/migrations`, לא auto-push לפרודקשן.
- **הוספת מודול חדש:** תיקייה תחת `/modules`, `index.ts` + `schema.ts` + `internal/`, רשומה ב-`WORK_PACKAGES.md`, בדיקת בידוד, ואם נוגע במידע מטופל — קריאה ל-`audit` ול-`patientFile.recordEvent`.
- **הוספת שדה גמיש:** הגדרה ב-Field Registry + סכמת Zod. אין סכמה → build נכשל.
