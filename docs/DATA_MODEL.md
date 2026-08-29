# DATA MODEL (טיוטה)

**עודכן:** 2026-08-29 · טיוטה ראשונית — תתעדכן ב-WP-04. כל טבלת דומיין נושאת `therapist_id`.

---

## אימות וזהות

### `therapist`
מטפל יחיד בגרסה זו. `id`, `name`, `email`, `created_at`.

### `user`
חשבון התחברות. `id`, `role` (`therapist` | `patient`), `email` (ייחודי), `password_hash`, `totp_secret` (nullable), `status` (`active`|`invited`|`disabled`), `failed_attempts`, `locked_until`, `patient_id` (nullable — למשתמשי מטופל), `therapist_id`, `created_at`.

### `session`
session מנוהל DB. `id`, `user_id`, `expires_at`, `created_at`, `ip`, `user_agent`.

### `invite`
הזמנת מטופל (magic-link). `id`, `patient_id`, `token_hash`, `expires_at`, `accepted_at`, `therapist_id`.

---

## מטופלים

### `patient`
`id`, `therapist_id`, `first_name`, `last_name`, `dob`, `phone`, `email`, `address`, `photo_url`,
`joined_at`, `status` (`active`|`inactive`|`completed`|`paused`), `treatment_goal`, `general_notes`, `created_at`, `updated_at`.

### `patient_treatment_type`
קשר רבים-לרבים. `patient_id`, `treatment_type` (`naturopathy`|`reflexology`|`nutrition`), `therapist_id`.

### `consent`
הסכמות המטופל. `id`, `patient_id`, `kind` (`data_processing`|`data_transfer_abroad`|`research_future`), `granted_at`, `text_version`, `therapist_id`.

---

## תיק ו-Timeline

### `timeline_event`
append-only. `id`, `patient_id`, `therapist_id`, `occurred_at`, `type`
(`appointment`|`session`|`plan_changed`|`task_created`|`task_completed`|`document_added`|`message`|`questionnaire_submitted`|`status_changed`),
`ref_id` (מזהה הרשומה במודול המקור), `summary` (טקסט קצר לתצוגה), `created_by`, `created_at`.
**אין CQRS.** קריאה = `SELECT ... WHERE patient_id = ? ORDER BY occurred_at DESC`.

---

## פגישות ויומן

### `appointment`
תור ביומן. `id`, `patient_id`, `therapist_id`, `starts_at`, `ends_at`, `treatment_type`, `status` (`scheduled`|`done`|`cancelled`|`no_show`), `notes`, `gcal_event_id` (nullable, שלב 2), `created_at`.

### `treatment_session`
תיעוד מפגש. `id`, `patient_id`, `therapist_id`, `appointment_id` (nullable), `date`, `treatment_type`,
`patient_report` (טקסט), `complaints`, `changes_since_last`, `treatment_done`, `therapist_notes`, `recommendations`,
`next_focus`, `created_at`, `updated_at`.
שדות פר-תחום (מדדים, פרטי טיפול ספציפיים) → `field_value` עם `entity='treatment_session'`.

---

## תוכניות ומשימות

### `treatment_plan`
תוכנית פעילה. `id`, `patient_id`, `therapist_id`, `current_version_id`, `created_at`.

### `treatment_plan_version`
`id`, `plan_id`, `version_no`, `content` (מובנה — ראה Field Registry), `created_by`, `created_at`, `note`.
המטופל רואה את הגרסה הנוכחית; שינוי = גרסה חדשה + `timeline_event('plan_changed')` + התראה.

### `task`
`id`, `patient_id`, `therapist_id`, `title`, `description`, `start_date`, `end_date`, `frequency` (`once`|`daily`|`weekly`|`custom`), `status` (`open`|`done`), `completed_at`, `created_at`.

---

## תקשורת ומסמכים

### `message_thread`
`id`, `patient_id`, `therapist_id`, `last_message_at`.

### `message`
`id`, `thread_id`, `sender` (`therapist`|`patient`), `body`, `sent_at`, `read_at` (nullable).
(קבצים בהודעות — שלב עתידי.)

### `document`
`id`, `patient_id`, `therapist_id`, `name`, `kind`, `file_key` (Blob), `mime`, `size`,
`uploaded_by` (`therapist`|`patient`), `visibility` (`therapist_only`|`therapist_and_patient`), `created_at`.

---

## Field Registry (נתונים גמישים)

### `field_definition`
`id`, `therapist_id`, `entity` (`treatment_session`|`plan_version`|`questionnaire`|`metric`),
`key`, `label_he`, `type` (`text`|`number`|`scale`|`boolean`|`select`|`date`|`table`),
`options` (JSONB — לרשימות), `zod_schema` (JSONB — הסכמה הסריאלית), `unit` (nullable),
`charted` (boolean — אם true, נדרש mapping לעמודה אמיתית), `order`, `active`, `created_at`.

### `field_value`
`id`, `therapist_id`, `patient_id`, `entity`, `entity_id`, `definition_id`, `value` (JSONB), `recorded_at`.
**כל כתיבה/קריאה עוברת דרך ה-validator היחיד ב-`core/fields`.**

---

## מדדים (שלב 2 — מוגדר עכשיו למניעת שכתוב)

### `metric_definition`
`id`, `therapist_id`, `key`, `label_he`, `unit`, `input_by` (`therapist`|`patient`|`both`), `chart_type`, `target` (nullable), `active`.

### `metric_entry`
**עמודות אמיתיות, לא JSONB.** `id`, `therapist_id`, `patient_id`, `definition_key`, `value_num`, `value_text` (nullable), `measured_at`, `source` (`therapist`|`patient_daily`), `created_at`.
אינדקס: `(patient_id, definition_key, measured_at)`.

---

## אבטחה ותפעול

### `audit_log`
append-only. `id`, `therapist_id`, `actor_user_id`, `actor_role`, `action`
(`view`|`create`|`update`|`delete`|`login`|`login_failed`|`invite`|`export`),
`entity`, `entity_id`, `patient_id` (nullable), `at`, `ip`, `meta` (JSONB).
שמירה: שנתיים (ADR — לאישור בנספח רגולציה).

### `notification`
`id`, `recipient_user_id`, `therapist_id`, `type`, `title_he`, `body_he`, `link`, `created_at`, `read_at` (nullable), `emailed_at` (nullable).

---

## הערות בידוד

- לכל טבלה עם `patient_id`: policy RLS = `therapist_id = current_therapist() AND (current_role() = 'therapist' OR patient_id = current_patient())`.
- מזהים: uuid v4, אטומים, לא רצים.
- מחיקת מטופל = anonymize + lock (לא hard delete) — בשל חובת שמירת רשומות. יוגדר ב-WP רגולציה.
