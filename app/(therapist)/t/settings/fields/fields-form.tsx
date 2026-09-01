"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "@/modules/core/design-system";
import { addFieldAction, type FieldState } from "./actions";

/**
 * Client-safe copy of the UI field-type list — importing it from
 * `@/modules/core/fields` would drag the DB client into the browser bundle.
 * Keep in sync with `UI_FIELD_TYPES` in `modules/core/fields/internal/manage.ts`.
 */
export const TYPE_LABEL = {
  number: "מספר",
  scale: "סולם (למשל 1–10)",
  boolean: "כן / לא",
  select: "בחירה מרשימה",
  text: "טקסט חופשי",
  date: "תאריך",
} as const;

export type UiFieldType = keyof typeof TYPE_LABEL;
const UI_FIELD_TYPES = Object.keys(TYPE_LABEL) as UiFieldType[];

const FIELD = "border-line bg-surface h-9 rounded-lg border px-2.5 text-sm";
const HINT = "text-ink-faint text-[12px] font-semibold";

export function AddFieldForm() {
  const [state, action, pending] = useActionState<FieldState, FormData>(addFieldAction, {});
  const [type, setType] = useState<UiFieldType>("number");

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <label htmlFor="f-label" className={HINT}>
            שם המדד
          </label>
          <Input id="f-label" name="labelHe" required maxLength={60} placeholder="למשל: לחץ דם" />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="f-type" className={HINT}>
            סוג
          </label>
          <select
            id="f-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as UiFieldType)}
            className={FIELD}
          >
            {UI_FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {type === "number" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <label htmlFor="f-unit" className={HINT}>
              יחידה (רשות)
            </label>
            <Input id="f-unit" name="unit" maxLength={16} placeholder="ק״ג" className="w-24" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="f-min" className={HINT}>
              מזערי
            </label>
            <Input id="f-min" name="min" type="number" step="any" className="w-24" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="f-max" className={HINT}>
              מרבי
            </label>
            <Input id="f-max" name="max" type="number" step="any" className="w-24" />
          </div>
          <label className="text-ink-soft flex items-center gap-1.5 pb-1.5 text-[13px]">
            <input type="checkbox" name="integer" className="size-3.5" /> מספר שלם בלבד
          </label>
        </div>
      )}

      {type === "scale" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <label htmlFor="f-smin" className={HINT}>
              מ־
            </label>
            <Input id="f-smin" name="min" type="number" defaultValue={1} className="w-20" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="f-smax" className={HINT}>
              עד
            </label>
            <Input id="f-smax" name="max" type="number" defaultValue={10} className="w-20" />
          </div>
        </div>
      )}

      {type === "select" && (
        <div className="grid gap-1.5">
          <label htmlFor="f-opts" className={HINT}>
            אפשרויות — אחת בכל שורה
          </label>
          <textarea
            id="f-opts"
            name="options"
            rows={4}
            required
            className="border-line bg-surface rounded-lg border px-2.5 py-2 text-sm"
            placeholder={"נמוך\nתקין\nגבוה"}
          />
        </div>
      )}

      {type === "text" && (
        <div className="grid gap-1.5">
          <label htmlFor="f-maxlen" className={HINT}>
            אורך מרבי (תווים, רשות)
          </label>
          <Input id="f-maxlen" name="maxLength" type="number" min={1} className="w-28" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-ink-soft flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" name="required" className="size-3.5" /> שדה חובה בתיעוד
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "מוסיף…" : "הוספת מדד"}
        </Button>
      </div>

      {state.error && (
        <p role="alert" className="text-danger text-[13px]">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sage-deep text-[13px]">המדד נוסף ✓</p>}
    </form>
  );
}
