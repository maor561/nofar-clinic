/**
 * Product identity in one place (WP-53). "Momentum" is the system; "נופר כהן"
 * is the naturopath who runs it — copy that addresses the patient by the
 * therapist's name stays as-is.
 */
export const BRAND = "Momentum";
export const BRAND_BY = "by Nofar-Cohen";
export const BRAND_SLOGAN = "תזונה שעובדת בשבילך כל יום מחדש";
export const THERAPIST_NAME = "נופר כהן";

/** For page <title>s: "מטופלים" -> "מטופלים — Momentum". */
export const pageTitle = (section: string): string => `${section} — ${BRAND}`;
