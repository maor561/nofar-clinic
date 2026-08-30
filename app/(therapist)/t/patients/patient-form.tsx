"use client";

import { useActionState } from "react";
import {
  Button,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/core/design-system";
import {
  patientStatus,
  treatmentType,
  consentKind,
  STATUS_LABEL,
  TREATMENT_LABEL,
  CONSENT_LABEL,
  type PatientStatus,
  type TreatmentType,
  type ConsentKind,
} from "@/modules/patients";

export type PatientFormState = { error?: string };

export type PatientFormValues = {
  firstName?: string;
  lastName?: string;
  dob?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  treatmentGoal?: string | null;
  generalNotes?: string | null;
  status?: PatientStatus;
  treatmentTypes?: TreatmentType[];
  consents?: ConsentKind[];
};

export function PatientForm({
  action,
  values,
  submitLabel,
  showStatus = false,
}: {
  action: (prev: PatientFormState, fd: FormData) => Promise<PatientFormState>;
  values?: PatientFormValues;
  submitLabel: string;
  showStatus?: boolean;
}) {
  const [state, formAction, pending] = useActionState<PatientFormState, FormData>(action, {});
  const v = values ?? {};
  const tt = new Set(v.treatmentTypes ?? []);
  const cs = new Set(v.consents ?? []);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="שם פרטי" name="firstName" defaultValue={v.firstName} required />
        <Field label="שם משפחה" name="lastName" defaultValue={v.lastName} required />
        <Field label="תאריך לידה" name="dob" type="date" defaultValue={v.dob ?? ""} />
        <Field label="טלפון" name="phone" defaultValue={v.phone ?? ""} />
        <Field label="דוא״ל" name="email" type="email" defaultValue={v.email ?? ""} />
        <Field label="כתובת" name="address" defaultValue={v.address ?? ""} />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-ink-soft text-xs font-bold">סוגי טיפול</legend>
        <div className="flex flex-wrap gap-3">
          {treatmentType.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm">
              <Checkbox name="treatmentTypes" value={t} defaultChecked={tt.has(t)} />
              {TREATMENT_LABEL[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="treatmentGoal">יעד טיפול</Label>
        <textarea
          id="treatmentGoal"
          name="treatmentGoal"
          defaultValue={v.treatmentGoal ?? ""}
          className="border-input min-h-[64px] rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="generalNotes">הערות כלליות</Label>
        <textarea
          id="generalNotes"
          name="generalNotes"
          defaultValue={v.generalNotes ?? ""}
          className="border-input min-h-[64px] rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-ink-soft text-xs font-bold">הסכמות</legend>
        <div className="space-y-2">
          {consentKind.map((k) => (
            <label key={k} className="flex items-start gap-2 text-[13px]">
              <Checkbox name="consents" value={k} defaultChecked={cs.has(k)} className="mt-0.5" />
              {CONSENT_LABEL[k]}
            </label>
          ))}
        </div>
      </fieldset>

      {showStatus && (
        <div className="grid max-w-xs gap-1.5">
          <Label htmlFor="status">סטטוס</Label>
          <Select name="status" defaultValue={v.status ?? "active"}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {patientStatus.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {state.error && (
        <p role="alert" className="bg-danger-soft/60 text-danger rounded-[10px] px-3 py-2 text-sm">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "שומר…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
      />
    </div>
  );
}
