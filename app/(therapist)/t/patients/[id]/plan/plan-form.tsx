"use client";

import { useActionState } from "react";
import { Button, Label } from "@/modules/core/design-system";
import { FieldInput, type RenderableFieldDef } from "@/modules/core/fields/field-input";

export type PlanFormState = { error?: string };
export type PlanFieldDef = RenderableFieldDef & { definitionId: string };

export function PlanForm({
  action,
  fieldDefs,
  values,
  currentVersionNo,
  submitLabel,
}: {
  action: (prev: PlanFormState, fd: FormData) => Promise<PlanFormState>;
  fieldDefs: PlanFieldDef[];
  values?: Record<string, unknown>;
  currentVersionNo: number | null;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<PlanFormState, FormData>(action, {});
  const v = values ?? {};

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      {currentVersionNo != null && (
        <p className="bg-sage-soft/50 text-sage-deep rounded-[10px] px-3 py-2 text-[13px]">
          שמירה תיצור את גרסה {currentVersionNo + 1}. גרסה {currentVersionNo} תישמר בהיסטוריה כפי
          שהיא.
        </p>
      )}

      <div className="space-y-5">
        {fieldDefs.map((def) => (
          <FieldInput
            key={def.definitionId}
            def={def}
            name={`field:${def.definitionId}`}
            defaultValue={v[def.definitionId]}
          />
        ))}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="note">מה השתנה בגרסה זו?</Label>
        <textarea
          id="note"
          name="note"
          placeholder="לא חובה — הערה קצרה שתופיע בהיסטוריה ובעדכון למטופל/ת"
          className="border-input min-h-[56px] rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
        />
      </div>

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "שומר…" : submitLabel}
      </Button>
    </form>
  );
}
