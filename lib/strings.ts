/**
 * Central Hebrew UI strings — key -> string.
 * Every user-facing string lives here so the UI stays consistent and a future
 * i18n layer can be added without a retrofit (ADR-008).
 */
export const strings = {
  scaffold_tagline: "ניהול הקשר הטיפולי",
  scaffold_ready_title: "התשתית עלתה",
  scaffold_ready_body:
    "Next.js App Router · RTL · Tailwind עם פלטת Calm Wellness · Assistant + Frank Ruhl Libre. המסכים האמיתיים ייבנו ב-WP-01 ואילך.",
  action_primary_example: "פעולה ראשית",
  action_secondary_example: "פעולה משנית",
} as const;

export type StringKey = keyof typeof strings;
