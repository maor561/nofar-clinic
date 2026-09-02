"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/modules/core/design-system";
import { MEAL_LABEL, MEALS } from "@/modules/food-log";
import { saveFoodDayAction, type FoodState } from "./actions";

type Values = Partial<Record<(typeof MEALS)[number] | "patientNote", string | null>>;

export function FoodForm({ date, values }: { date: string; values: Values }) {
  const [state, action, pending] = useActionState<FoodState, FormData>(
    saveFoodDayAction.bind(null, date),
    {},
  );
  const router = useRouter();
  const savedAt = useRef(0);

  useEffect(() => {
    if (state.ok && state.ok !== savedAt.current) {
      savedAt.current = state.ok;
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      {MEALS.map((m) => (
        <div key={m} className="grid gap-1.5">
          <label htmlFor={m} className="text-sm font-semibold">
            {MEAL_LABEL[m]}
          </label>
          <textarea
            id={m}
            name={m}
            defaultValue={values[m] ?? ""}
            rows={2}
            placeholder="מה אכלת?"
            className="border-line bg-surface rounded-lg border px-3 py-2 text-sm"
          />
        </div>
      ))}

      <div className="grid gap-1.5">
        <label htmlFor="patientNote" className="text-sm font-semibold">
          הערות שלי (איך הרגשתי, כמות, שעות…)
        </label>
        <textarea
          id="patientNote"
          name="patientNote"
          defaultValue={values.patientNote ?? ""}
          rows={3}
          className="border-line bg-surface rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "שומר…" : "שמירת היום"}
        </Button>
        {state.error && (
          <p role="alert" className="text-danger text-[13px]">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sage-deep text-[13px]">נשמר ✓</p>}
      </div>
    </form>
  );
}
