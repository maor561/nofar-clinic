"use client";

import { useEffect, useState } from "react";
import { Button } from "@/modules/core/design-system";
import { currentPushStatus, enablePush, disablePush, type PushStatus } from "./subscribe";

/**
 * Enable / disable background push notifications on this device (WP-65).
 * Fully degrades: unsupported browser, VAPID not configured, or permission
 * blocked each show a plain explanatory line instead of the toggle.
 */
export function PushToggle() {
  const [status, setStatus] = useState<PushStatus | "loading">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    currentPushStatus().then((s) => {
      if (live) setStatus(s);
    });
    return () => {
      live = false;
    };
  }, []);

  async function toggle(on: boolean) {
    setBusy(true);
    try {
      setStatus(on ? await enablePush() : await disablePush());
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => toggle(false)}
        >
          {busy ? "…" : "כיבוי"}
        </Button>
      ) : (
        <Button type="button" size="sm" disabled={busy} onClick={() => toggle(true)}>
          {busy ? "…" : "הפעלת התראות"}
        </Button>
      )}
    </div>
  );
}
