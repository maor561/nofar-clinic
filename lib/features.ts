/**
 * Feature flags — turn a capability off without removing its code.
 *
 * When a flag is `false`: its routes return 404, nav entries and dashboard
 * tiles are hidden, and server actions refuse. The module code, migrations
 * and tests stay in place. Flip back to `true` to restore the feature.
 */
export const FEATURES = {
  /**
   * WP-16 messaging (therapist ↔ patient chat).
   * Hidden 2026-08-31 per request — code retained, UI + routes disabled.
   */
  messaging: false,
} as const;

export type FeatureName = keyof typeof FEATURES;
