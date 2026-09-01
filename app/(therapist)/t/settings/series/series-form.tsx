"use client";

import { useActionState } from "react";
import { Button, Input } from "@/modules/core/design-system";
import { addSeriesAction, type SeriesState } from "./actions";

const FIELD = "border-line bg-surface h-9 rounded-lg border px-2.5 text-sm";

export function AddSeriesForm({ treatmentTypes }: { treatmentTypes: string[] }) {
  const [state, action, pending] = useActionState<SeriesState, FormData>(addSeriesAction, {});

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="grid flex-1 gap-1.5">
        <label htmlFor="s-name" className="text-ink-faint text-[12px] font-semibold">
          שם הסדרה
        </label>
        <Input
          id="s-name"
          name="name"
          required
          maxLength={80}
          placeholder="למשל: סדרת רפלקסולוגיה"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="s-count" className="text-ink-faint text-[12px] font-semibold">
          מפגשים
        </label>
        <Input
          id="s-count"
          name="sessionCount"
          type="number"
          min={1}
          max={100}
          required
          defaultValue={6}
          className="w-20"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="s-tt" className="text-ink-faint text-[12px] font-semibold">
          סוג טיפול (רשות)
        </label>
        <select id="s-tt" name="treatmentType" defaultValue="none" className={FIELD}>
          <option value="none">— ללא —</option>
          {treatmentTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "מוסיף…" : "הוספה"}
      </Button>
      {state.error && (
        <p role="alert" className="text-danger w-full text-[13px]">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sage-deep w-full text-[13px]">נוספה ✓</p>}
    </form>
  );
}
