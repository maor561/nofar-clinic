"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@/modules/core/design-system";
import { acceptInviteAction, type InviteState } from "./actions";

export function InviteForm({ token, email }: { token: string; email: string }) {
  const action = acceptInviteAction.bind(null, token);
  const [state, formAction, pending] = useActionState<InviteState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">ברוכה הבאה 🌿</h1>
        <p className="text-ink-soft text-sm">נותר רק להגדיר סיסמה לחשבון שלך.</p>
      </div>

      <div className="border-sage-soft bg-sage-tint flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[12.5px]">
        <span className="bg-sage-soft text-sage-deep grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
          נכ
        </span>
        <span>
          <b>נופר כהן</b> הזמינה אותך למרחב הטיפולי
          <br />
          <span className="text-ink-faint">{email}</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">בחירת סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          autoFocus
        />
        <p className="text-ink-faint text-[11.5px]">לפחות 10 תווים.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">אימות סיסמה</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "רגע…" : "כניסה למרחב שלי"}
      </Button>

      <p className="text-ink-faint text-[11.5px]">
        קישור ההזמנה תקף ל־7 ימים ולשימוש חד־פעמי. הדוא״ל הוא שם המשתמש — אין צורך ליצור אחד.
      </p>
    </form>
  );
}
