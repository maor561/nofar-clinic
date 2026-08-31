"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/modules/core/design-system";
import { FieldInput, type RenderableFieldDef } from "@/modules/core/fields/field-input";

export type QFormState = { error?: string; ok?: number };
export type QFieldDef = RenderableFieldDef & { definitionId: string };

export function QuestionnaireForm({
  action,
  fieldDefs,
  values,
  submitLabel,
}: {
  action: (prev: QFormState, fd: FormData) => Promise<QFormState>;
  fieldDefs: QFieldDef[];
  values?: Record<string, unknown>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<QFormState, FormData>(action, {});
  const v = values ?? {};
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.replace("/p/questionnaire");
  }, [state.ok, router]);

  return (
    <form action={formAction} className="max-w-xl space-y-6">
      {fieldDefs.map((def) => (
        <FieldInput
          key={def.definitionId}
          def={def}
          name={`field:${def.definitionId}`}
          defaultValue={v[def.definitionId]}
        />
      ))}

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "שולח…" : submitLabel}
      </Button>
    </form>
  );
}
