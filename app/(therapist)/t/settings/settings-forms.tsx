"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@/modules/core/design-system";
import {
  changePasswordAction,
  beginTotpAction,
  confirmTotpAction,
  type PwState,
  type TotpState,
} from "./actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(changePasswordAction, {});

  return (
    <form action={action} className="grid max-w-sm gap-3">
      <PwField name="current" label="סיסמה נוכחית" />
      <PwField name="next" label="סיסמה חדשה" hint="לפחות 8 תווים, אות וספרה" />
      <PwField name="confirm" label="אימות סיסמה חדשה" />
      {state.error && (
        <p role="alert" className="text-danger text-[13px]">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sage-deep text-[13px]">הסיסמה הוחלפה ✓</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "מחליף…" : "החלפת סיסמה"}
      </Button>
    </form>
  );
}

function PwField({ name, label, hint }: { name: string; label: string; hint?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="password" required autoComplete="off" />
      {hint && <span className="text-ink-faint text-[11px]">{hint}</span>}
    </div>
  );
}

export function TotpEnroll({ enabled }: { enabled: boolean }) {
  const [enroll, setEnroll] = useState<{ qr: string; secret: string } | null>(null);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (enabled) {
    return (
      <p className="text-sage-deep flex items-center gap-2 text-sm font-semibold">
        <span className="bg-sage-soft grid size-5 place-items-center rounded-full text-[11px]">
          ✓
        </span>
        אימות דו־שלבי פעיל
      </p>
    );
  }

  if (!enroll) {
    return (
      <div className="space-y-2">
        <p className="text-ink-soft text-[13px]">
          שכבת הגנה שנייה — קוד מתחלף מאפליקציית אימות (Google Authenticator / Authy) בכל כניסה.
        </p>
        <Button
          size="sm"
          disabled={starting}
          onClick={async () => {
            setStarting(true);
            setErr(null);
            const r = await beginTotpAction();
            setStarting(false);
            if ("error" in r) setErr(r.error);
            else setEnroll(r);
          }}
        >
          {starting ? "מכין…" : "הפעלת אימות דו־שלבי"}
        </Button>
        {err && <p className="text-danger text-[13px]">{err}</p>}
      </div>
    );
  }

  return <TotpConfirm enroll={enroll} onCancel={() => setEnroll(null)} />;
}

function TotpConfirm({
  enroll,
  onCancel,
}: {
  enroll: { qr: string; secret: string };
  onCancel: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<TotpState, FormData>(
    confirmTotpAction.bind(null, enroll.secret),
    {},
  );

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <div className="max-w-md space-y-3">
      <p className="text-ink-soft text-[13px]">
        סרקו את הברקוד באפליקציית האימות (או הזינו את המפתח ידנית), ואז הקלידו את הקוד שמופיע.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={enroll.qr} alt="ברקוד לאימות דו־שלבי" className="border-line rounded-lg border" />
      <p className="text-ink-faint text-[11px]">
        מפתח ידני: <span className="text-ink font-mono break-all select-all">{enroll.secret}</span>
      </p>
      <form action={action} className="flex items-end gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="code">קוד מהאפליקציה</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="w-32 tracking-[0.3em]"
            required
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "מאמת…" : "אישור והפעלה"}
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="text-danger text-[13px]">
          {state.error}
        </p>
      )}
      <button type="button" onClick={onCancel} className="text-ink-faint text-[12px] underline">
        ביטול
      </button>
    </div>
  );
}
