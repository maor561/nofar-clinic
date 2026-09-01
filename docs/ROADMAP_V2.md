# ROADMAP V2 — דיוקים ותוספות

**נוצר:** 2026-09-01 · מקור: רשימת 17 בקשות מהלקוחה (נופר).
**✅ הושלם 2026-09-02 — WP-50..66 כולם גמורים** חוץ מ-**WP-62** (חסום על חומר מהלקוחה: נוסח מסמך הסכמה + הגדרת שאלון). כל שאר 16 הבקשות מומשו, נבדקו (163 בדיקות) ונדחפו ל-`main` (CI ירוק). ADRs 042–046 מתעדים את ההחלטות הארכיטקטוניות. חסמי לקוח פתוחים: VAPID keys ל-Vercel (WP-65), רוטציית מפתחות שהודבקו בצ'אט.
סטטוסים: ⬜ לא התחיל · 🟡 בעבודה · ✅ גמור · ⛔ חוסם (ממתין לחומר/החלטה)
לכל WP: **מה** · **גישה מוצעת** · **תלוי** · **שאלות פתוחות** (❓).

הסדר נקבע לפי: קודם מה שלא חסום ובעל ערך מיידי → מיתוג (כשיגיע חומר) → אשכול סוגי טיפול וסדרות → מדדים דינמיים → תקשורת קלינית → מסמכים → פלטפורמה (PWA) → מחיקת מידע (אחרון, בלתי-הפיך).

---

## שלב 1 — Quick wins (ללא חוסמים)

### WP-50 · "פוקוס שבועי עד המפגש הבא" (#7) ✅
**בוצע 2026-09-01.** `modules/sessions/sections.ts` — תווית `nextFocus` → "פוקוס שבועי עד המפגש הבא". תווית פנימית במסך המפגש (לא נחשף למטופל — נפרד מ-WP-61 סיכום למטופל).

### WP-51 · צפייה במפגשים קודמים של מטופל (#12) ✅
**בוצע 2026-09-01.** מסך `/t/patients/[id]/sessions` — רשימת כל המפגשים (תאריך, צ'יפים של סוגי טיפול, תקציר) + קישור ל-`/t/sessions/[id]`, כפתור "מפגשים" בתיק. `listSessions(tdb, { patientId })`.

### WP-52 · בחירת יותר מסוג טיפול אחד בתיעוד מפגש (#4) ✅
**בוצע 2026-09-01.** `treatment_session.treatment_types` = `text[]` (מיגרציה `0016` + backfill מהעמודה הישנה; העמודה הישנה `treatment_type` נשארת מתה לרציפות snapshot). מסך המפגש → checkboxes מרובים. תצוגה בכל מקום כרשימת צ'יפים / `join(" · ")`. `renameTreatmentType` מעדכן את המערך דרך `array_replace`. בדיקת round-trip.

---

## שלב 2 — מיתוג

### WP-53 · שם מערכת חדש: "Momentum" (#13) ✅ (לוגו וקטורי — בהמשך)
**בוצע 2026-09-01.** `lib/brand.ts` — `BRAND = "Momentum"`, `BRAND_BY = "by Nofar-Cohen"`, `BRAND_SLOGAN = "תזונה שעובדת בשבילך כל יום מחדש"`, `THERAPIST_NAME`. `<title>` דרך template ב-root layout (`%s — Momentum`), כל 45 המסכים עברו sed. `Logo` wordmark = "Momentum" + subtitle "by Nofar-Cohen" בשני ה-shells. דף הבית: הסלוגן ככותרת. `/privacy`, מיילים (wordmark + footer), TOTP issuer, תיאור אירוע Google — כולם "Momentum". **הבחנה נשמרה:** "נופר" כמטפלת (מיילים "פגישה עם נופר", "פנו לנופר") לא שונה. הלוגו הגרפי — הלקוחה תשלח קובץ וקטורי, אז נחליף את סמל העלה + נוסיף favicon/PWA icons.

### WP-54 · פלטת צבעים (#2) ✅
**בוצע 2026-09-01.** מהלוגו: `--color-sage-soft #dbe4d8`, `--color-ground #fefbf1`, `--color-blush-soft #e9d4d5`. הותאמו ה-tokens הסמוכים (sage, sage-tint, surface-2, line, line-soft, chart-2/3) לכיוון הקרם החמים. sage-deep, ink וצבעי סטטוס — ללא שינוי. עדיין light-only.

---

## שלב 3 — סוגי טיפול וסדרות טיפול

### WP-55 · סוגי טיפול דינמיים (#5) ✅ 🔑
**בוצע 2026-09-01.** טבלה `treatment_type` (therapist-scoped: name/active/sort_order, מיגרציה `0015` + seed 3 בעברית + המרת ה-slugs הישנים). הערך המאוחסן על appointments/sessions/patient_treatment_type = **השם**; שינוי שם עושה bulk-update לרשומות. `listTreatmentTypes`/`createTreatmentType`/`renameTreatmentType`/`setTreatmentTypeActive` ב-`modules/patients`. מסך `/t/settings/treatment-types` (הוספה/שינוי שם/השבתה). כל הבוחרים (הקמת מטופל, יומן, מפגש) + הפילטרים + התוויות עברו לרשימה הדינמית. `TreatmentType` type = `string`. 4 בדיקות בידוד. אומת בדפדפן: הוספת "ירידה במשקל" הופיעה מיד בטופס הקמת מטופל; המרת ה-slugs עבדה (מטופלים מציגים "רפלקסולוגיה"/"תזונה").

_[גרסה מקורית]_ ⬜ 🔑
**מה:** כרגע `treatmentType = ["naturopathy","reflexology","nutrition"]` — enum בקוד (`modules/patients/schema.ts`), בשימוש ב-`patient_treatment_type`, `appointment`, `treatment_session`. הלקוחה רוצה להוסיף/להסיר סוגי טיפול בעצמה מההגדרות.
**גישה:** טבלה חדשה `treatment_type` (therapist-scoped: `id`, `name`, `active`, `sortOrder`). מיגרציית backfill של 3 הקיימים. החלפת ה-enum במחרוזת חופשית / FK בכל 3 המקומות. מסך `/t/settings/treatment-types` (CRUD, ללא מחיקה קשה של סוג בשימוש — רק השבתה). `TREATMENT_LABEL` הופך ל-lookup.
**תלוי:** — · **חבילת בסיס לכל שלב 3.**
**❓** מאשרת החלפת ה-enum בטבלה (נוגע ב-appointments/sessions/patients + מיגרציה + backfill)? השבתת סוג בשימוש = מוסתר לבחירות חדשות אך נשמר ברשומות ישנות — מקובל?

### WP-56 · סדרות טיפול — הגדרה + שיוך בהקמת לקוח (#9) ✅
**בוצע 2026-09-01.** `treatment_series_template` (therapist-scoped: name/session_count/treatment_type/active) + `patient_series` (dual-scoped: snapshot של name+count, `used_count`, status active/completed/cancelled, `ending_notified_at` מוכן ל-WP-59). מיגרציה `0017`. שירותים ב-`modules/patients`. מסך `/t/settings/series` (CRUD) + card בהגדרות. בחירת סדרה בטופס הקמת מטופל (`seriesOptions`) + card "סדרת טיפול" בתיק המטופל (שיוך / ביטול / התקדמות + progress bar). **`setAppointmentStatus`** מקדם/מוריד את `used_count` במעבר ל/מ-"done", וסוגר את הסדרה אוטומטית במכסה (מחזיר `SeriesProgress` — מוכן ל-WP-59). 5 בדיקות בידוד. אומת בדפדפן מקצה לקצה: יצירת סדרה → שיוך → סימון פגישה "התקיימה" → "בוצעו 1 מתוך 8 · נותרו 7".
**❓ נותר:** סדרה פעילה אחת בכל רגע (ברירת מחדל). ריבוי במקביל — בהמשך אם יידרש.

_[גרסה מקורית]_ ⬜
**מה:** "סדרת טיפולים" = חבילה בשם + מספר מפגשים (למשל "סדרת רפלקסולוגיה — 6 מפגשים"). מוגדרת בהגדרות, נבחרת בהקמת מטופל חדש.
**גישה:** `treatment_series_template` (therapist-scoped: `name`, `treatmentType?`, `sessionCount`, `active`) — CRUD ב-`/t/settings`. `patient_series` (שיוך: `patientId`, `templateId` או snapshot של `name`+`count`, `startedAt`, `status`). מסך הקמת מטופל → בחירת סדרה (אחת או יותר — ראה ❓).
**תלוי:** WP-55 (בחירת סוג הטיפול לסדרה).
**❓ (קריטי לכל האשכול):** (א) מה מקדם את מונה המפגשים בסדרה — פגישה שסומנה "התקיימה", תיעוד מפגש שנוצר, או ידני? (ב) האם למטופל יכולה להיות יותר מסדרה פעילה אחת בו-זמנית?

### WP-57 · דשבורד מטופל — כמה טיפולים נשארו / בוצעו (#10) ✅
**בוצע 2026-09-02.** כרטיס "סדרת הטיפול שלך" ב-`/p` — "בוצעו X מתוך N · נותרו Y" + progress bar, קריאה מ-`getActivePatientSeries(pdb, ...)`. אזהרת amber כשנותרו ≤2.

### WP-58 · קביעה עצמית מוגבלת לפי מכסת הסדרה (#16) ✅
**בוצע 2026-09-02.** `seriesBookableLeft(pdb, patientId)` = `sessionCount − usedCount − futureScheduled`; `null` (ללא הגבלה) כשאין סדרה פעילה. נאכף בשלושה מקומות: `bookSlotAction` (הודעת שגיאה), `/p/appointments/new/page.tsx` (EmptyState "השתמשת בכל המפגשים בסדרה"), `/p/appointments/page.tsx` (`canBook` + טקסט "אפשר לקבוע עוד N מפגשים בסדרה"). **החלטה:** ללא סדרה = קביעה חופשית כמו היום.

### WP-59 · התראה בשני המפגשים האחרונים בסדרה (#11) ✅
**בוצע 2026-09-02.** ב-`setStatusAction` (אחרי `setAppointmentStatus` שמחזיר `SeriesProgress`): `series.justCompleted` → `notify({ type: "series_completed", email: true })`; `remaining > 0 && ≤ 2 && !endingNotifiedAt` → `notify({ type: "series_ending", email: true })` + `markSeriesEndingNotified(tdb, series.id)` (הגנה מפני כפילות). סוגי התראה חדשים `series_ending` / `series_completed`.

---

## שלב 4 — מדדים דינמיים

### WP-60 · פרמטרים ומדדי מדידה נוספים מההגדרות (#6) ✅ 🔑
**בוצע 2026-09-02 · ADR-042.** מסך `/t/settings/fields` (entity `treatment_session` בלבד — "מדדי מפגש"). `modules/core/fields/internal/manage.ts`: `listFieldDefs` / `createFieldDef` / `updateFieldDef` — כל `schema` מורכב מקלטי טופס ועובר `compileFieldSchema` **לפני** כתיבה (הגבול היחיד). סוגים: מספר (יחידה/מזערי/מרבי/שלם) · סולם · כן-לא · בחירה · טקסט · תאריך. אין `table`/`charted` דרך UI. סוג+schema ננעלים עם היצירה (עריכה = שם/סדר/פעיל). שדות מובנים מסומנים "מובנה". ▲▼ למיון. 6 בדיקות בידוד. אומת מקצה-לקצה: הוספת "היקף מותניים (ס״מ)" בהגדרות → הופיע אוטומטית בטופס תיעוד המפגש אחרי "משקל". **החלטה:** רק `treatment_session` (השאלון = WP-62).
**❓ נענה:** רק מדדי מפגש. `plan_version`/`questionnaire` נשארים בקוד.

---

## שלב 5 — תקשורת קלינית

### WP-61 · סיכום מפגש למטופל (#8) ✅
**בוצע 2026-09-02.** שדה `treatment_session.patient_summary` (מיגרציה `0018`) — **השדה היחיד מהמפגש שהמטופל רואה**; הערות מטפלת ושאר השדות נשארים פנימיים. בזרימת המפגש: קטע 4 "סיכום למטופל/ת". בשמירה עם תוכן → התראה + מייל "סיכום המפגש שלך" עם קישור ל-`/p/sessions`; `updateSession` שולח שוב רק אם הטקסט השתנה בפועל. מסך מטופל חדש `/p/sessions` + פריט ניווט "המפגשים שלי" (`listSharedSummaries(pdb)`, patient-scoped). מסך המפגש אצל המטפלת מציג את הכרטיס המשותף. סוג התראה `session_summary`. +2 בדיקות בידוד. אומת מקצה-לקצה: מטפלת כתבה סיכום → הופיע ב-`/p/sessions` של אותו מטופל בלבד, סיכום של מטופל אחר לא דלף.
**❓ נענה:** שדה סיכום ייעודי (לא חשיפת כל התיעוד — הכלל הזהב).

### WP-62 · מסמך הסכמה טיפולי + דיוק שאלון קליטה (#3) ⛔
**מה:** בהקמת לקוח חדש — מעבר לשאלון, המטופל חותם על מסמך הסכמה טיפולי. + דיוק תוכן השאלון.
**גישה:** מסמך הסכמה כתוכן (טקסט/HTML) בהגדרות או קבוע; מסך `/p/consent` — הצגה + כפתור "קראתי ואני מסכים/ה" + חתימה (שם + timestamp + IP) → רשומה ב-`consent` (הטבלה קיימת). חוסם כניסה למערכת עד חתימה (כמו שאלון). דיוק השאלון = עדכון `FIELD_REGISTRY` entity `questionnaire` לפי הספק החדש.
**חוסם:** הלקוחה תשלח (א) נוסח מסמך ההסכמה, (ב) הגדרת השאלון המדויקת.

---

## שלב 6 — מסמכים

### WP-63 · שליחת מסמך/ים למספר מטופלים בו-זמנית (#17) ✅
**בוצע 2026-09-02 · ADR-043.** מסך `/t/documents` → כרטיס "שליחת מסמך למספר מטופלים": קובץ + סוג + צ'ק-ליסט מטופלים (עם סינון) → `shareDocumentWithPatients(tdb, patientIds, meta, fileKeyFor)` — רשומת `document` נפרדת בתיק כל מטופל (`therapist_and_patient`, `uploaded_by=therapist`) + אירוע `document_added` + התראת `document_shared`. **עותק blob פר-מטופל** (מפתח נפרד) — כל שורה עצמאית למחיקה/גישה. `patientId` זר מבטל את כל האצווה לפני כתיבה. +2 בדיקות בידוד. 152 בדיקות ✓.
**❓ נענה:** עותק blob פר-מטופל (לא משותף) — עצמאות מלאה, עלות זניחה.

### WP-64 · מחיקה אוטומטית של מסמכים אחרי שנה + לולאת אישור (#15) ✅
**בוצע 2026-09-02 · ADR-044.** עמודה `document.retention_defer_until` (מיגרציה `0019`). קבוצת הבדיקה = `created_at < now-365d AND (retention_defer_until IS NULL OR < now)` — השאילתה עצמה היא הרשימה, ללא state machine. מסך `/t/documents/review`: "שמירה" → `+90d`, "מחיקה" → `deleteDocument` (row+blob+audit). **ללא cron** — מוצר מטפל-יחיד: `countRetentionReview(tdb)` נקרא ב-`/t` וב-`/t/documents` ומראה באנר אזהרה עם קישור. 3 בדיקות בידוד.
**❓ נענה:** שום סוג לא מוחרג אוטומטית — המטפלת מאשרת כל מחיקה ידנית; המסך מזכיר חובת שמירה אפשרית (באחריותה, כמו #14).

---

## שלב 7 — פלטפורמה

### WP-65 · PWA להתקנה + התראות Push (#1) ✅
**בוצע 2026-09-02 · ADR-045.** **PWA:** `app/manifest.ts` (RTL/he, standalone, theme `#8aa287`, אייקונים 192/512/maskable מ-`logo-mark.png`), `<ServiceWorker/>` ב-layout רושם `public/sw.js` (push + notificationclick; ללא cache ב-v1). **Web Push:** `modules/core/push` (טבלה `push_subscription` מיגרציה `0020`, `web-push`/VAPID, `sendPushToUser` best-effort + גיזום 404/410) — **מחווט ל-`notify()`** כך שכל התראה קיימת נשלחת גם כ-Push. מסלולים `/api/push/{vapid,subscribe,unsubscribe}`. `<PushToggle>` ב-`/t/settings` וב-`/p/profile` (מתדרדר: לא נתמך / לא מוגדר / חסום). 5 בדיקות בידוד. אומת: manifest + `/api/push/vapid` + SW נרשם ו-activated.
**❓ נענה:** Push מלא ברקע (החלטת הלקוח מהסיכום — "full background Push + PWA").
**חסם לקוח:** `WEB_PUSH_VAPID_PUBLIC_KEY` / `_PRIVATE_KEY` / `WEB_PUSH_SUBJECT` ב-Vercel env.

---

## שלב 8 — מחיקת מידע (אחרון — בלתי-הפיך)

### WP-66 · מחיקת לקוח מלאה (#14) ✅ 🔒
**בוצע 2026-09-02 · ADR-046 (עוקף את `OPERATIONS.md` §מחיקת מידע).** `deletePatientCompletely(tdb, id)` ב-`modules/patients`: מוחק את כל ה-blobs של מסמכי המטופל → `tdb.delete(patient, …)` יחיד scoped. מיגרציה `0021` הוסיפה `ON DELETE CASCADE` ל-`field_value`/`invite`/`user` (קודם בלי FK) → המחיקה גוררת גם login → session/notification/push. `audit_log` **נשמר בכוונה** (append-only + trigger; מטא-דאטה בלבד = accountability). UI: כרטיס "אזור מסוכן" ב-`/t/patients/[id]/edit` (checkbox + הקלדת שם מלא), `deletePatientAction` מאמת שם בשרת. 3 בדיקות בידוד (0 שורות בכל טבלה, tenant שני שלם, מטפלת אחרת → `patient_not_found`).
**❓ נענה:** (א) מחיקה קשה בלתי-הפיכה, באחריות הלקוחה, עם המלצה מוצגת להיוועץ בעו״ד.

---

## מה חוסם עכשיו (חומר מהלקוחה)

| פריט | ממתין ל |
|---|---|
| WP-53 | קובץ לוגו + שם המערכת |
| WP-54 | פלטת צבעים |
| WP-62 | נוסח מסמך הסכמה טיפולי + הגדרת שאלון קליטה מדויקת |

## החלטות (נענו 2026-09-01)

1. **WP-65 / #1** — ✅ **Push מלא ברקע + PWA**. באייפון חובה "הוסף למסך הבית" תחילה (מגבלת Apple, לא ניתן לעקוף).
2. **WP-66 / #14** — ✅ **מחיקה קשה בלתי-הפיכה**, הלקוחה לוקחת אחריות (מנוגד להמלצת `OPERATIONS.md` — anonymize+lock. נדרש ADR שמתעד את העקיפה + המלצה להיוועץ בעו״ד).
3. **WP-56 / #9** — ✅ מונה הסדרה עולה כש**פגישה מסומנת "התקיימה"** ביומן. *(פתוח לאישור ב-WP-56: סדרה פעילה אחת בכל רגע — ברירת מחדל; ריבוי סדרות במקביל = בהמשך.)*
4. **WP-55 / #5 + WP-60 / #6** — ✅ **הכול דינמי ומנוהל מההגדרות.** סוגי טיפול: הוספה/הסרה בהגדרות → מתעדכן אוטומטית בכל מקום (יומן, מפגשים, תיק מטופל, הקמה). נתוני מדידה: מה שהמטפלת מגדירה בהגדרות מופיע בכל מקום שיש נתוני מדידה (כרגע רק "משקל"). enum→טבלה מאושר, כולל מיגרציה + backfill.

## סדר ביצוע מוצע

WP-50 → WP-51 → WP-55 → WP-52 → WP-56 → WP-57 → WP-58 → WP-59 → WP-60 → WP-61 → WP-63 → WP-64 → WP-65 → WP-66
· מיתוג (WP-53 + WP-54) — משתחל ברגע שהחומר מגיע, לפני WP-65.
· WP-62 — משתחל ברגע שהחומר מגיע, מקביל לשלב 3–4.
