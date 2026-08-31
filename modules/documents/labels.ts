/**
 * Pure enums + Hebrew labels — safe to import from client components. The
 * service module and schema re-export these.
 */
export const documentKind = [
  "lab_result",
  "summary",
  "referral",
  "image",
  "form",
  "other",
] as const;
export type DocumentKind = (typeof documentKind)[number];

export const documentVisibility = ["therapist_only", "therapist_and_patient"] as const;
export type DocumentVisibility = (typeof documentVisibility)[number];

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  lab_result: "בדיקת מעבדה",
  summary: "סיכום",
  referral: "הפניה",
  image: "תמונה",
  form: "טופס",
  other: "אחר",
};

export const DOCUMENT_VISIBILITY_LABEL: Record<DocumentVisibility, string> = {
  therapist_only: "פנימי (למטפלת בלבד)",
  therapist_and_patient: "משותף עם המטופל/ת",
};
