"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input, Label } from "@/modules/core/design-system";
import { requestResetAction, type ForgotState } from "./actions";

export function ForgotForm() {
  const [state, formAction, pending] = useActionState<ForgotState, FormData>(
    requestResetAction,
    {},
  );

  if (state.sent) {
    return (
      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          בדקו את הדוא״ל
        </h1>
        <p className="text-ink-soft text-sm">
          אם הכתובת רשומה במערכת, נשלח אליה קישור לאיפוס הסיסמה. הקישור תקף לשעה.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">חזרה להתחברות</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">איפוס סיסמה</h1>
        <p className="text-ink-soft text-sm">נשלח קישור לאיפוס לכתובת הדוא״ל של החשבון.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">דוא״ל</Label>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </div>

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "רגע…" : "שליחת קישור"}
      </Button>

      <Link href="/login" className="text-sage-deep block text-xs font-semibold hover:underline">
        חזרה להתחברות
      </Link>
    </form>
  );
}
