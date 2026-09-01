/**
 * Pure metadata for the treatment-session flow — safe to import from client
 * components (no DB / server deps). The service module re-exports this.
 */
export const SESSION_SECTIONS = [
  { key: "patientReport", labelHe: "דיווח המטופל/ת", group: "state" },
  { key: "complaints", labelHe: "תלונות עיקריות", group: "state" },
  { key: "changesSinceLast", labelHe: "שינויים מהמפגש הקודם", group: "state" },
  { key: "treatmentDone", labelHe: "הטיפול שבוצע", group: "treatment" },
  { key: "recommendations", labelHe: "המלצות", group: "followup" },
  { key: "therapistNotes", labelHe: "הערות מטפלת (פנימי)", group: "followup" },
  { key: "nextFocus", labelHe: "פוקוס שבועי עד המפגש הבא", group: "followup" },
  { key: "patientSummary", labelHe: "סיכום למטופל/ת", group: "share" },
] as const;

export type SessionSectionKey = (typeof SESSION_SECTIONS)[number]["key"];
