"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@/modules/core/design-system";
import { completeResetAction, type ResetState } from "./actions";

export function ResetForm({ token }: { token: string }) {
  const action = completeResetAction.bind(null, token);
  const [state, formAction, pending] = useActionState<ResetState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          בחירת סיסמה חדשה
        </h1>
        <p className="text-ink-soft text-sm">לאחר השמירה תתבקשו להתחבר מחדש.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">סיסמה חדשה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          autoFocus
        />
        <p className="text-ink-faint text-[11.5px]">לפחות 10 תווים, כולל אות וספרה.</p>
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
        {pending ? "רגע…" : "שמירה"}
      </Button>
    </form>
  );
}
