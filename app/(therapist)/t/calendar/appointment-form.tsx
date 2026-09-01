"use client";

import { useActionState, useState } from "react";
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
import { treatmentType, TREATMENT_LABEL } from "@/modules/patients";
import { DayTimeline } from "./day-timeline";

export type AppointmentFormState = { error?: string };

export type PatientOption = { id: string; name: string };

/** One busy span on a clinic day, as minute offsets from midnight. */
export type DayBusyItem = {
  startMin: number;
  endMin: number;
  kind: "google" | "appt";
  label: string;
};
export type DayBlocks = { date: string; label: string; items: DayBusyItem[] };

export type AppointmentFormValues = {
  patientId?: string;
  date?: string;
  time?: string;
  durationMin?: number;
  treatmentType?: string | null;
  notes?: string | null;
};

const DURATIONS = [30, 45, 60, 90, 120];

export function AppointmentForm({
  action,
  patients,
  values,
  submitLabel,
  lockPatient = false,
  dayBlocks,
}: {
  action: (prev: AppointmentFormState, fd: FormData) => Promise<AppointmentFormState>;
  patients: PatientOption[];
  values?: AppointmentFormValues;
  submitLabel: string;
  lockPatient?: boolean;
  dayBlocks?: DayBlocks[];
}) {
  const [state, formAction, pending] = useActionState<AppointmentFormState, FormData>(action, {});
  const v = values ?? {};
  const [date, setDate] = useState(v.date ?? "");
  const [time, setTime] = useState(v.time ?? "09:00");
  const [durationMin, setDurationMin] = useState(v.durationMin ?? 60);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-1.5">
        <Label htmlFor="patientId">מטופל/ת</Label>
        {lockPatient && v.patientId ? (
          <>
            <input type="hidden" name="patientId" value={v.patientId} />
            <p className="border-line bg-surface-2 rounded-lg border px-3 py-2 text-sm">
              {patients.find((p) => p.id === v.patientId)?.name ?? "—"}
            </p>
          </>
        ) : (
          <Select name="patientId" defaultValue={v.patientId}>
            <SelectTrigger id="patientId">
              <SelectValue placeholder="בחרו מטופל/ת" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="date">תאריך</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={v.date ?? ""}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="time">שעה</Label>
          <Input
            id="time"
            name="time"
            type="time"
            defaultValue={v.time ?? "09:00"}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="durationMin">משך (דק׳)</Label>
          <Select
            name="durationMin"
            defaultValue={String(v.durationMin ?? 60)}
            onValueChange={(val) => setDurationMin(Number(val))}
          >
            <SelectTrigger id="durationMin">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {dayBlocks && (
        <DayTimeline dayBlocks={dayBlocks} date={date} time={time} durationMin={durationMin} />
      )}

      <div className="grid max-w-xs gap-1.5">
        <Label htmlFor="treatmentType">סוג טיפול</Label>
        <Select name="treatmentType" defaultValue={v.treatmentType ?? "none"}>
          <SelectTrigger id="treatmentType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— ללא —</SelectItem>
            {treatmentType.map((t) => (
              <SelectItem key={t} value={t}>
                {TREATMENT_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">הערות</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={v.notes ?? ""}
          className="border-input min-h-[64px] rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
        />
      </div>

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      {dayBlocks && (
        <label className="text-ink-faint flex items-center gap-2 text-[12.5px]">
          <input type="checkbox" name="allowConflict" className="accent-sage size-3.5" />
          אפשר קביעה גם אם יש חפיפה לחסימה קיימת
        </label>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "שומר…" : submitLabel}
      </Button>
    </form>
  );
}
