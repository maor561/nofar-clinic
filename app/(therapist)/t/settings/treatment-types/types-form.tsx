"use client";

import { useActionState } from "react";
import { Button, Input } from "@/modules/core/design-system";
import { addTypeAction, type TTState } from "./actions";

export function AddTypeForm() {
  const [state, action, pending] = useActionState<TTState, FormData>(addTypeAction, {});

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="grid flex-1 gap-1.5">
        <label htmlFor="name" className="text-ink-faint text-[12px] font-semibold">
          שם סוג טיפול חדש
        </label>
        <Input id="name" name="name" required maxLength={60} placeholder="למשל: עיסוי רקמות עמוק" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "מוסיף…" : "הוספה"}
      </Button>
      {state.error && (
        <p role="alert" className="text-danger w-full text-[13px]">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sage-deep w-full text-[13px]">נוסף ✓</p>}
    </form>
  );
}
