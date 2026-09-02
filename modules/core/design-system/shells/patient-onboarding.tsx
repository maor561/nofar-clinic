"use client";

import { useEffect, useState } from "react";
import { Icon } from "../icon";
import {
  enablePush,
  currentPushStatus,
  devicePlatform,
  isStandalone,
  type PushStatus,
} from "@/modules/core/push/subscribe";

const FLAG = "momentum:onboarded";

const A2HS: Record<"ios" | "android" | "other", string> = {
  ios: "בספארי: כפתור השיתוף למטה ← “הוספה למסך הבית”.",
  android: "בתפריט הדפדפן (⋮) ← “התקנת אפליקציה” / “הוספה למסך הבית”.",
  other: "בתפריט הדפדפן ← “הוספה למסך הבית” כדי לפתוח את המרחב כאפליקציה.",
};

/**
 * First-run setup sheet for the patient on a new device (WP-68): add to home
 * screen + turn on push. Shown once per device (localStorage). Everything here
 * is also reachable later from the "עוד" sheet and the profile.
 */
export function PatientOnboarding() {
  const [open, setOpen] = useState(false);
  const [push, setPush] = useState<PushStatus | "loading">("loading");
  const [busy, setBusy] = useState(false);
  const standalone = isStandalone();

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(FLAG) === "1";
    } catch {
      seen = false;
    }
    // show once the component has mounted on the client (no SSR flash)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setOpen(true);
    currentPushStatus().then(setPush);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(FLAG, "1");
    } catch {
      /* private mode — the sheet just won't persist; fine */
    }
    setOpen(false);
  }

  async function turnOn() {
    setBusy(true);
    try {
      setPush(await enablePush());
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  const platform = devicePlatform();
  const pushOn = push === "on";
  const pushBlocked = push === "denied" || push === "unsupported" || push === "unconfigured";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45">
      <div
        role="dialog"
        aria-label="הגדרת החשבון"
        className="bg-surface border-line w-full max-w-md rounded-t-2xl border-t p-5"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
      >
        <div className="bg-ink-faint/25 mx-auto mb-4 h-1 w-9 rounded-full" />
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
          כמה שניות להגדרה
        </h2>
        <p className="text-ink-soft mt-1 text-[13px]">
          כדי שהמרחב יעבוד כמו אפליקציה על המכשיר הזה.
        </p>

        {!standalone && (
          <div className="border-line-soft mt-4 flex items-start gap-3 border-t pt-4">
            <span className="bg-sage-soft text-sage-deep grid size-9 shrink-0 place-items-center rounded-full">
              <Icon name="phone" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">הוספה למסך הבית</p>
              <p className="text-ink-soft mt-0.5 text-[12.5px] leading-relaxed">{A2HS[platform]}</p>
            </div>
          </div>
        )}

        <div className="border-line-soft mt-4 flex items-start gap-3 border-t pt-4">
          <span className="bg-sage-soft text-sage-deep grid size-9 shrink-0 place-items-center rounded-full">
            <Icon name="bell" size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">הפעלת התראות</p>
            <p className="text-ink-soft mt-0.5 text-[12.5px] leading-relaxed">
              תזכורות לפגישות, משימות וסיכומים — גם כשהמרחב סגור.
            </p>
            {pushOn ? (
              <p className="text-sage-deep mt-2 text-[13px] font-semibold">התראות פעילות ✓</p>
            ) : pushBlocked ? (
              <p className="text-ink-faint mt-2 text-[12.5px]">
                {push === "denied"
                  ? "ההתראות חסומות בהגדרות הדפדפן — אפשר לאפשר שם."
                  : push === "unconfigured"
                    ? "התראות עדיין לא הוגדרו בשרת."
                    : "הדפדפן הזה לא תומך בהתראות."}
              </p>
            ) : (
              <button
                type="button"
                onClick={turnOn}
                disabled={busy}
                className="bg-sage-deep mt-2 rounded-lg px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
              >
                {busy ? "…" : "הפעלת התראות"}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="text-ink-faint mt-5 w-full py-2 text-center text-[13px] font-semibold"
        >
          {pushOn || standalone ? "סיום" : "אחר כך"}
        </button>
      </div>
    </div>
  );
}
