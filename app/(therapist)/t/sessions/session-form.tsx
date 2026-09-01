"use client";

import { useActionState } from "react";
import {
  Button,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/core/design-system";
import { FieldInput, type RenderableFieldDef } from "@/modules/core/fields/field-input";
import { SESSION_SECTIONS } from "@/modules/sessions/sections";

export type SessionFormState = { error?: string };

export type SessionFieldDef = RenderableFieldDef & { definitionId: string };

export type SessionFormValues = {
  date?: string;
  treatmentType?: string | null;
  patientReport?: string | null;
  complaints?: string | null;
  changesSinceLast?: string | null;
  treatmentDone?: string | null;
  recommendations?: string | null;
  therapistNotes?: string | null;
  nextFocus?: string | null;
  fields?: Record<string, unknown>;
};

const GROUPS: { id: string; title: string; hint?: string }[] = [
  { id: "state", title: "מצב המטופל/ת", hint: "איך הגיע/ה, מה השתנה, מדדים" },
  { id: "treatment", title: "הטיפול שבוצע" },
  { id: "followup", title: "המלצות והמשך" },
];

export function SessionForm({
  action,
  fieldDefs,
  values,
  patientName,
  submitLabel,
  treatmentTypes,
}: {
  action: (prev: SessionFormState, fd: FormData) => Promise<SessionFormState>;
  fieldDefs: SessionFieldDef[];
  values?: SessionFormValues;
  patientName: string;
  submitLabel: string;
  treatmentTypes: string[];
}) {
  const [state, formAction, pending] = useActionState<SessionFormState, FormData>(action, {});
  const v = values ?? {};
  const secByGroup = (g: string) => SESSION_SECTIONS.filter((s) => s.group === g);
  const metricDefs = fieldDefs;

  return (
    <form action={formAction} className="max-w-2xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="date">תאריך המפגש</Label>
          <Input id="date" name="date" type="date" defaultValue={v.date ?? ""} required />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="treatmentType">סוג טיפול</Label>
          <Select name="treatmentType" defaultValue={v.treatmentType ?? "none"}>
            <SelectTrigger id="treatmentType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— ללא —</SelectItem>
              {treatmentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {GROUPS.map((g, i) => (
        <section key={g.id} className="space-y-4">
          <div className="border-line flex items-baseline gap-2 border-b pb-1.5">
            <span className="bg-sage-soft text-sage-deep grid size-5 place-items-center rounded-full text-[11px] font-bold">
              {i + 1}
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">{g.title}</h2>
            {g.hint && <span className="text-ink-faint text-[12px]">· {g.hint}</span>}
          </div>

          {secByGroup(g.id).map((s) => (
            <div key={s.key} className="grid gap-1.5">
              <Label htmlFor={s.key}>{s.labelHe}</Label>
              <textarea
                id={s.key}
                name={s.key}
                defaultValue={(v[s.key as keyof SessionFormValues] as string) ?? ""}
                className="border-input min-h-[70px] rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
              />
            </div>
          ))}

          {g.id === "state" && metricDefs.length > 0 && (
            <div className="border-line-soft grid gap-4 rounded-xl border p-3.5 sm:grid-cols-2">
              {metricDefs.map((def) => (
                <FieldInput
                  key={def.definitionId}
                  def={def}
                  name={`field:${def.definitionId}`}
                  defaultValue={v.fields?.[def.definitionId]}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "שומר…" : submitLabel}
        </Button>
        <span className="text-ink-faint text-[12px]">מפגש עבור {patientName}</span>
      </div>
    </form>
  );
}
