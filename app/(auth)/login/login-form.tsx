"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Icon, Input, Label } from "@/modules/core/design-system";
import { loginAction, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          {state.needsTotp ? "אימות דו־שלבי" : "התחברות למערכת"}
        </h1>
        <p className="text-ink-soft text-sm">
          {state.needsTotp ? "הזינו את הקוד מאפליקציית האימות." : "הזינו את פרטי החשבון שלכם."}
        </p>
      </div>

      <input type="hidden" name="next" value={next} />

      {!state.needsTotp ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="email">דוא״ל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={state.email}
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="password">סיסמה</Label>
              <Link href="/forgot" className="text-sage-deep text-xs font-semibold hover:underline">
                שכחתי סיסמה
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value={state.email ?? ""} />
          {/* password is re-entered on the totp step for safety */}
          <div className="space-y-1.5">
            <Label htmlFor="password2">סיסמה</Label>
            <Input
              id="password2"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="totpCode">קוד אימות</Label>
            <Input
              id="totpCode"
              name="totpCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
            />
          </div>
        </>
      )}

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "רגע…" : state.needsTotp ? "אימות וכניסה" : "התחברות"}
      </Button>

      {!state.needsTotp && (
        <p className="text-ink-faint flex items-start gap-2 text-xs">
          <Icon name="shield" size={14} className="text-sage mt-0.5" />
          <span>למטפלת: לאחר הסיסמה יתבקש קוד אימות דו־שלבי מאפליקציית האימות.</span>
        </p>
      )}
    </form>
  );
}
