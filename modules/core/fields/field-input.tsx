"use client";

import { useState } from "react";
import { Checkbox, Input, Label, cn } from "@/modules/core/design-system";
import type { FieldSchema } from "./internal/field-schema";

export type RenderableFieldDef = {
  key: string;
  labelHe: string;
  type: string;
  unit?: string | null;
  schema: FieldSchema;
};

/**
 * Basic field rendering for the Field Registry types (text / number / scale /
 * boolean / select / date). One hidden-friendly control per type — form posts
 * `name` (JSON for multi-value types).
 */
export function FieldInput({
  def,
  name,
  defaultValue,
}: {
  def: RenderableFieldDef;
  name: string;
  defaultValue?: unknown;
}) {
  const label = (
    <Label htmlFor={name} className="flex items-center gap-2">
      {def.labelHe}
      {def.unit ? (
        <span className="text-ink-faint text-[11px] font-medium">({def.unit})</span>
      ) : null}
    </Label>
  );

  return (
    <div className="grid gap-1.5">
      {label}
      <Control def={def} name={name} defaultValue={defaultValue} />
    </div>
  );
}

function Control({
  def,
  name,
  defaultValue,
}: {
  def: RenderableFieldDef;
  name: string;
  defaultValue?: unknown;
}) {
  const s = def.schema;

  if (s.type === "scale") {
    return (
      <ScaleControl name={name} min={s.min} max={s.max} defaultValue={defaultValue as number} />
    );
  }

  if (s.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <Checkbox name={name} value="true" defaultChecked={defaultValue === true} /> כן
      </label>
    );
  }

  if (s.type === "select") {
    if (s.multiple) {
      const chosen = new Set(Array.isArray(defaultValue) ? (defaultValue as string[]) : []);
      return (
        <div className="flex flex-col gap-1.5">
          {s.options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <Checkbox name={name} value={o} defaultChecked={chosen.has(o)} /> {o}
            </label>
          ))}
        </div>
      );
    }
    return (
      <select
        id={name}
        name={name}
        defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
        className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
      >
        <option value="">—</option>
        {s.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (s.type === "date") {
    return (
      <Input
        id={name}
        name={name}
        type="date"
        defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
      />
    );
  }

  if (s.type === "number") {
    return (
      <Input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        min={s.min}
        max={s.max}
        step={s.integer ? 1 : "any"}
        defaultValue={typeof defaultValue === "number" ? defaultValue : ""}
      />
    );
  }

  // text (multiline when it can be long)
  const long = s.type === "text" && (s.maxLength ?? 0) > 120;
  if (long) {
    return (
      <textarea
        id={name}
        name={name}
        maxLength={s.type === "text" ? s.maxLength : undefined}
        defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
        className="border-input min-h-[74px] rounded-lg border bg-transparent px-2.5 py-1.5 text-sm"
      />
    );
  }
  return (
    <Input
      id={name}
      name={name}
      maxLength={s.type === "text" ? s.maxLength : undefined}
      defaultValue={typeof defaultValue === "string" ? defaultValue : ""}
    />
  );
}

function ScaleControl({
  name,
  min,
  max,
  defaultValue,
}: {
  name: string;
  min: number;
  max: number;
  defaultValue?: number;
}) {
  const [val, setVal] = useState<number | undefined>(
    typeof defaultValue === "number" ? defaultValue : undefined,
  );
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <>
      <input type="hidden" name={name} value={val ?? ""} />
      <div className="flex flex-wrap gap-1.5">
        {steps.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={val === n}
            onClick={() => setVal(n)}
            className={cn(
              "h-8 w-9 rounded-lg border text-sm font-bold transition-colors",
              val === n
                ? "border-sage bg-sage-soft text-sage-deep"
                : "border-line text-ink-soft hover:border-sage",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </>
  );
}
