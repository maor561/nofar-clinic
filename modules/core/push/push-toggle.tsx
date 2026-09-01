"use client";

import { useEffect, useState } from "react";
import { Button } from "@/modules/core/design-system";

type Status = "loading" | "unsupported" | "unconfigured" | "denied" | "off" | "on";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function detect(): Promise<{ status: Status; vapid: string | null }> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { status: "unsupported", vapid: null };
  }
  let vapid: string | null = null;
  try {
    const r = await fetch("/api/push/vapid");
    vapid = (await r.json())?.key ?? null;
  } catch {
    vapid = null;
  }
  if (!vapid) return { status: "unconfigured", vapid: null };
  if (Notification.permission === "denied") return { status: "denied", vapid };
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return { status: sub ? "on" : "off", vapid };
  } catch {
    return { status: "off", vapid };
  }
}

/**
 * Enable / disable background push notifications on this device (WP-65).
 * Fully degrades: unsupported browser, VAPID not configured, or permission
 * blocked each show a plain explanatory line instead of the toggle.
 */
export function PushToggle() {
  const [{ status, vapid }, setState] = useState<{ status: Status; vapid: string | null }>({
    status: "loading",
    vapid: null,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    detect().then((s) => {
      if (live) setState(s);
    });
    return () => {
      live = false;
    };
  }, []);

  async function enable() {
    if (!vapid) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState({ status: perm === "denied" ? "denied" : "off", vapid });
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState({ status: res.ok ? "on" : "off", vapid });
    } catch {
      setState({ status: "off", vapid });
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState({ status: "off", vapid });
    } catch {
      /* leave as-is */
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return <p className="text-ink-faint text-[13px]">בודק…</p>;
  if (status === "unsupported")
    return <p className="text-ink-faint text-[13px]">הדפדפן הזה לא תומך בהתראות Push.</p>;
  if (status === "unconfigured")
    return <p className="text-ink-faint text-[13px]">התראות Push עדיין לא הוגדרו בשרת.</p>;
  if (status === "denied")
    return (
      <p className="text-ink-faint text-[13px]">
        ההתראות חסומות בהגדרות הדפדפן לאתר הזה. יש לאפשר אותן שם ולרענן.
      </p>
    );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm">
        {status === "on"
          ? "התראות Push פעילות במכשיר הזה."
          : "קבלו התראות גם כשהאתר סגור, על המכשיר הזה."}
      </span>
      {status === "on" ? (
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={disable}>
          {busy ? "…" : "כיבוי"}
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={busy} onClick={enable}>
          {busy ? "…" : "הפעלת התראות"}
        </Button>
      )}
    </div>
  );
}
