"use client";

import { useActionState } from "react";
import { Button, Input } from "@/modules/core/design-system";
import { addTemplateAction, type TplState } from "./actions";

export function AddTemplateForm() {
  const [state, action, pending] = useActionState<TplState, FormData>(addTemplateAction, {});
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-1.5">
        <label htmlFor="t-name" className="text-ink-faint text-[12px] font-semibold">
          שם השאלון
        </label>
        <Input
          id="t-name"
          name="name"
          required
          maxLength={80}
          placeholder="למשל: שאלון נטורופתי ראשוני"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="t-desc" className="text-ink-faint text-[12px] font-semibold">
          טקסט פתיחה למטופל/ת (רשות)
        </label>
        <textarea
          id="t-desc"
          name="descriptionHe"
          rows={3}
          className="border-line bg-surface rounded-lg border px-2.5 py-2 text-sm"
          placeholder="הסבר קצר שיוצג מעל השאלון"
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "יוצר…" : "יצירת שאלון"}
        </Button>
        {state.error && (
          <p role="alert" className="text-danger text-[13px]">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sage-deep text-[13px]">נוצר ✓</p>}
      </div>
    </form>
  );
}
