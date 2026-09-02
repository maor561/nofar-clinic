"use client";

/**
 * Client helper: turn Web Push on for this device. Shared by the settings
 * toggle and the first-run onboarding sheet (WP-65 / WP-68). Every failure mode
 * resolves to a status string — it never throws.
 */

export type PushStatus = "unsupported" | "unconfigured" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function vapidKey(): Promise<string | null> {
  try {
    const r = await fetch("/api/push/vapid");
    return (await r.json())?.key ?? null;
  } catch {
    return null;
  }
}

/** True when the subscription was created with `expectedB64` as applicationServerKey. */
function subMatchesKey(sub: PushSubscription, expectedB64: string): boolean {
  const raw = sub.options?.applicationServerKey;
  if (!raw) return false;
  const a = new Uint8Array(raw as ArrayBuffer);
  const b = urlBase64ToUint8Array(expectedB64);
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

async function dropSub(sub: PushSubscription): Promise<void> {
  try {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  } catch {
    /* ignore */
  }
  try {
    await sub.unsubscribe();
  } catch {
    /* ignore */
  }
}

/**
 * Current push status for this device, without prompting. A subscription made
 * with a *different* VAPID key (server key rotated / fixed) is stale — the push
 * service would reject every send — so we drop it and report "off", prompting a
 * one-tap re-enable.
 */
export async function currentPushStatus(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  const key = await vapidKey();
  if (!key) return "unconfigured";
  if (Notification.permission === "denied") return "denied";
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return "off";
    if (!subMatchesKey(sub, key)) {
      await dropSub(sub);
      return "off";
    }
    return "on";
  } catch {
    return "off";
  }
}

/** Ask permission + subscribe + register with the server. Any stale subscription
 *  is replaced, so this button always ends on a subscription matching the
 *  current server key. */
export async function enablePush(): Promise<PushStatus> {
  if (!pushSupported()) return "unsupported";
  const key = await vapidKey();
  if (!key) return "unconfigured";
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return perm === "denied" ? "denied" : "off";
    const reg = await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    if (existing && !subMatchesKey(existing, key)) await dropSub(existing);

    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }));
    const res = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sub.toJSON()),
    });
    return res.ok ? "on" : "off";
  } catch {
    return "off";
  }
}

/** Unsubscribe this device. */
export async function disablePush(): Promise<PushStatus> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await dropSub(sub);
  } catch {
    /* leave as-is */
  }
  return "off";
}

/** "ios" | "android" | "other" — drives the add-to-home-screen copy. */
export function devicePlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

/** True when already running as an installed PWA. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}
