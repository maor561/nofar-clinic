"use client";

import { useActionState } from "react";
import { bookSlotAction, type BookState } from "./actions";

export type DaySlots = {
  label: string;
  slots: { iso: string; time: string; full: string }[];
};

export function BookGrid({ days }: { days: DaySlots[] }) {
  const [state, action, pending] = useActionState<BookState, FormData>(bookSlotAction, {});
  const anySlot = days.some((d) => d.slots.length > 0);

  return (
    <div className="space-y-4">
      {state.error && (
        <p role="alert" className="text-danger bg-danger/5 rounded-lg px-3 py-2 text-[13px]">
          {state.error}
        </p>
      )}

      {!anySlot ? (
        <p className="text-ink-faint text-sm">אין שעות פנויות בשבוע הזה. נסו שבוע אחר.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((d) => (
            <div key={d.label} className="space-y-2">
              <h3 className="text-ink-faint text-[12px] font-bold">{d.label}</h3>
              {d.slots.length === 0 ? (
                <p className="text-ink-faint text-[12px]">—</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {d.slots.map((s) => (
                    <form key={s.iso} action={action}>
                      <input type="hidden" name="start" value={s.iso} />
                      <button
                        type="submit"
                        disabled={pending}
                        onClick={(e) => {
                          if (!window.confirm(`לקבוע פגישה ל${s.full}?`)) e.preventDefault();
                        }}
                        className="border-line hover:border-sage hover:bg-sage-soft/40 rounded-lg border px-2.5 py-1 text-[13px] font-semibold tabular-nums transition-colors disabled:opacity-50"
                      >
                        {s.time}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
