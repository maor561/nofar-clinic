"use client";

import { useActionState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/core/design-system";
import { taskFrequency, TASK_FREQUENCY_LABEL } from "@/modules/tasks/labels";

export type TaskFormState = { error?: string };

export type TaskFormValues = {
  title?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  frequency?: string;
};

export function TaskForm({
  action,
  values,
  submitLabel,
}: {
  action: (prev: TaskFormState, fd: FormData) => Promise<TaskFormState>;
  values?: TaskFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<TaskFormState, FormData>(action, {});
  const v = values ?? {};

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <div className="grid gap-1.5">
        <Label htmlFor="title">כותרת המשימה</Label>
        <Input id="title" name="title" defaultValue={v.title ?? ""} required />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="description">פירוט</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={v.description ?? ""}
          className="border-input min-h-[72px] rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="startDate">מתאריך</Label>
          <Input id="startDate" name="startDate" type="date" defaultValue={v.startDate ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="endDate">עד תאריך</Label>
          <Input id="endDate" name="endDate" type="date" defaultValue={v.endDate ?? ""} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="frequency">תדירות</Label>
          <Select name="frequency" defaultValue={v.frequency ?? "once"}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {taskFrequency.map((f) => (
                <SelectItem key={f} value={f}>
                  {TASK_FREQUENCY_LABEL[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
