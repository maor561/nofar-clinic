"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "@/modules/core/design-system";
import { addQuestionAction, type TplState } from "../actions";

export const Q_TYPE_LABEL = {
  text: "טקסט חופשי",
  number: "מספר",
  scale: "סולם (למשל 1–5)",
  boolean: "כן / לא (אישור)",
  select: "בחירה מרשימה",
  date: "תאריך",
} as const;
export type QType = keyof typeof Q_TYPE_LABEL;
const Q_TYPES = Object.keys(Q_TYPE_LABEL) as QType[];

const FIELD = "border-line bg-surface h-9 rounded-lg border px-2.5 text-sm";
const HINT = "text-ink-faint text-[12px] font-semibold";

export function AddQuestionForm({ templateId }: { templateId: string }) {
  const [state, action, pending] = useActionState<TplState, FormData>(
    addQuestionAction.bind(null, templateId),
    {},
  );
  const [type, setType] = useState<QType>("text");

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid flex-1 gap-1.5">
          <label htmlFor="q-label" className={HINT}>
            נוסח השאלה
          </label>
          <Input
            id="q-label"
            name="labelHe"
            required
            maxLength={300}
            placeholder="למשל: מה מטרת הטיפול?"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="q-type" className={HINT}>
            סוג תשובה
          </label>
          <select
            id="q-type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as QType)}
            className={FIELD}
          >
            {Q_TYPES.map((t) => (
              <option key={t} value={t}>
                {Q_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {type === "scale" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <label htmlFor="q-min" className={HINT}>
              מ־
            </label>
            <Input id="q-min" name="min" type="number" defaultValue={1} className="w-20" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="q-max" className={HINT}>
              עד
            </label>
            <Input id="q-max" name="max" type="number" defaultValue={5} className="w-20" />
          </div>
        </div>
      )}

      {type === "number" && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1.5">
            <label htmlFor="q-nmin" className={HINT}>
              מזערי (רשות)
            </label>
            <Input id="q-nmin" name="min" type="number" step="any" className="w-24" />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="q-nmax" className={HINT}>
              מרבי (רשות)
            </label>
            <Input id="q-nmax" name="max" type="number" step="any" className="w-24" />
          </div>
        </div>
      )}

      {type === "select" && (
        <div className="grid gap-1.5">
          <label htmlFor="q-opts" className={HINT}>
            אפשרויות — אחת בכל שורה
          </label>
          <textarea
            id="q-opts"
            name="options"
            rows={4}
            required
            className="border-line bg-surface rounded-lg border px-2.5 py-2 text-sm"
            placeholder={"כן\nלא\nאחר"}
          />
        </div>
      )}

      {type === "text" && (
        <div className="grid gap-1.5">
          <label htmlFor="q-maxlen" className={HINT}>
            אורך מרבי (תווים, רשות)
          </label>
          <Input id="q-maxlen" name="maxLength" type="number" min={1} className="w-28" />
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-ink-soft flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" name="required" defaultChecked className="size-3.5" /> שאלת חובה
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? "מוסיף…" : "הוספת שאלה"}
        </Button>
      </div>

      {state.error && (
        <p role="alert" className="text-danger text-[13px]">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sage-deep text-[13px]">נוספה ✓</p>}
    </form>
  );
}
