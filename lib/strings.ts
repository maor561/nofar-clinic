/**
 * Central Hebrew UI strings — key -> string.
 * Every user-facing string lives here so the UI stays consistent and a future
 * i18n layer can be added without a retrofit (ADR-008).
 */
export const strings = {
  scaffold_tagline: "ניהול הקשר הטיפולי",
  scaffold_ready_body:
    "Next.js App Router · RTL · Tailwind עם פלטת Calm Wellness · Assistant + Rubik. המסכים האמיתיים נבנים לפי חבילות העבודה.",
} as const;

export type StringKey = keyof typeof strings;
