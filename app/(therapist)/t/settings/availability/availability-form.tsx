"use client";

import { useActionState, useState } from "react";
import { Button, Label, Icon } from "@/modules/core/design-system";
import { WEEKDAY_LABELS } from "@/modules/availability";
import {
  saveAvailabilityAction,
  addBlockedDateAction,
  removeBlockedDateAction,
  type AvailabilityFormState,
} from "./actions";

const FIELD = "border-line bg-surface h-9 rounded-lg border px-2.5 text-sm";

export type Window = { start: string; end: string };
export type DayValue = { enabled: boolean; windows: Window[] };

function DayRow({ index, value }: { index: number; value: DayValue }) {
  const [windows, setWindows] = useState<Window[]>(value.windows);

  const set = (i: number, patch: Partial<Window>) =>
    setWindows((ws) => ws.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  const add = () => setWindows((ws) => [...ws, { start: ws.at(-1)?.end ?? "16:00", end: "20:00" }]);
  const remove = (i: number) => setWindows((ws) => ws.filter((_, j) => j !== i));

  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
      <label className="mt-1.5 flex w-24 shrink-0 items-center gap-2">
        <input
          type="checkbox"
          name={`d${index}_enabled`}
          defaultChecked={value.enabled}
          className="accent-sage size-4"
        />
        <span className="text-sm">{WEEKDAY_LABELS[index]}</span>
      </label>

      <div className="flex flex-col gap-1.5">
        {windows.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="time"
              name={`d${index}_start`}
              value={w.start}
              onChange={(e) => set(i, { start: e.target.value })}
              className={FIELD}
            />
            <span className="text-ink-faint">–</span>
            <input
              type="time"
              name={`d${index}_end`}
              value={w.end}
              onChange={(e) => set(i, { end: e.target.value })}
              className={FIELD}
            />
            {windows.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="הסרת חלון"
                className="text-ink-faint hover:text-danger"
              >
                <Icon name="x" size={15} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="text-sage-deep w-fit text-[12px] font-semibold hover:underline"
        >
          + הוספת חלון שעות
        </button>
      </div>
    </div>
  );
}
export type PolicyValue = {
  selfSchedulingEnabled: boolean;
  slotMinutes: number;
  granularityMinutes: number;
  leadHours: number;
  horizonDays: number;
  bufferMinutes: number;
};
export type BlockedDate = { id: string; date: string; note: string | null };

export function AvailabilityForm({ days, policy }: { days: DayValue[]; policy: PolicyValue }) {
  const [state, action, pending] = useActionState<AvailabilityFormState, FormData>(
    saveAvailabilityAction,
    {},
  );

  return (
    <form action={action} className="space-y-6">
      <label className="border-line bg-surface-2 flex items-center gap-2.5 rounded-lg border p-3">
        <input
          type="checkbox"
          name="selfSchedulingEnabled"
          defaultChecked={policy.selfSchedulingEnabled}
          className="accent-sage size-4"
        />
        <span className="text-sm font-semibold">
          אפשר למטופלים לקבוע תור בעצמם לפי החלונות הפנויים
        </span>
      </label>

      <fieldset className="space-y-3">
        <legend className="text-ink-faint mb-1 text-[11px] font-bold tracking-wide">
          שעות עבודה שבועיות
        </legend>
        {days.map((d, i) => (
          <DayRow key={i} index={i} value={d} />
        ))}
        <p className="text-ink-faint text-[11px]">
          יום ללא סימון לא יוצע כלל. אפשר להוסיף כמה חלונות באותו יום (למשל 10:00–14:00 וגם
          16:00–20:00), כל עוד הם לא חופפים.
        </p>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumRow label="משך פגישה שמטופל קובע">
          <select name="slotMinutes" defaultValue={policy.slotMinutes} className={FIELD}>
            {[30, 45, 60, 75, 90, 120].map((n) => (
              <option key={n} value={n}>
                {n} דקות
              </option>
            ))}
          </select>
        </NumRow>
        <NumRow label="מרווח בין שעות מוצעות">
          <select
            name="granularityMinutes"
            defaultValue={policy.granularityMinutes}
            className={FIELD}
          >
            {[15, 20, 30, 45, 60].map((n) => (
              <option key={n} value={n}>
                כל {n} דקות
              </option>
            ))}
          </select>
        </NumRow>
        <NumRow label="התראה מוקדמת מינימלית">
          <span className="flex items-center gap-2">
            <input
              type="number"
              name="leadHours"
              min={0}
              max={168}
              defaultValue={policy.leadHours}
              className={`${FIELD} w-20`}
            />
            <span className="text-ink-soft text-[13px]">שעות מראש</span>
          </span>
        </NumRow>
        <NumRow label="עד כמה קדימה אפשר לקבוע">
          <span className="flex items-center gap-2">
            <input
              type="number"
              name="horizonDays"
              min={1}
              max={180}
              defaultValue={policy.horizonDays}
              className={`${FIELD} w-20`}
            />
            <span className="text-ink-soft text-[13px]">ימים</span>
          </span>
        </NumRow>
        <NumRow label="ריווח לפני ואחרי פגישה">
          <select name="bufferMinutes" defaultValue={policy.bufferMinutes} className={FIELD}>
            {[0, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "ללא" : `${n} דקות`}
              </option>
            ))}
          </select>
        </NumRow>
      </div>

      {state.error && (
        <p role="alert" className="text-danger text-[13px]">
          {state.error}
        </p>
      )}
      {state.ok && <p className="text-sage-deep text-[13px]">הזמינות נשמרה ✓</p>}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "שומר…" : "שמירת זמינות"}
      </Button>
    </form>
  );
}

function NumRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function BlockedDates({ items }: { items: BlockedDate[] }) {
  const [state, action, pending] = useActionState<AvailabilityFormState, FormData>(
    addBlockedDateAction,
    {},
  );

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="text-ink-faint text-[13px]">אין תאריכים חסומים.</p>
      ) : (
        <ul className="divide-line-soft divide-y">
          {items.map((b) => (
            <li key={b.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="tabular-nums">{b.date}</span>
              {b.note && <span className="text-ink-faint text-[12px]">{b.note}</span>}
              <form action={removeBlockedDateAction.bind(null, b.id)} className="ms-auto">
                <button
                  type="submit"
                  className="text-ink-faint hover:text-danger"
                  aria-label="הסרה"
                >
                  <Icon name="x" size={15} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="flex flex-wrap items-end gap-2">
        <div className="grid gap-1.5">
          <Label htmlFor="blk-date">תאריך לחסימה</Label>
          <input id="blk-date" type="date" name="date" required className={FIELD} />
        </div>
        <div className="grid flex-1 gap-1.5">
          <Label htmlFor="blk-note">הערה (רשות)</Label>
          <input
            id="blk-note"
            name="note"
            placeholder="חופשה / השתלמות…"
            className={`${FIELD} w-full`}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "מוסיף…" : "חסימה"}
        </Button>
      </form>
      {state.error && (
        <p role="alert" className="text-danger text-[13px]">
          {state.error}
        </p>
      )}
    </div>
  );
}
