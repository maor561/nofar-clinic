import type { FieldValueOut } from "@/modules/core/fields";

function fmt(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "כן" : "לא";
  return String(v);
}

/** Read-only list of questionnaire answers — shared by the patient + therapist views. */
export function AnswersList({ fields }: { fields: FieldValueOut[] }) {
  if (fields.length === 0) {
    return <p className="text-ink-faint text-sm">לא נרשמו תשובות.</p>;
  }
  return (
    <dl className="max-w-xl space-y-3">
      {fields.map((f) => (
        <div key={f.definitionId} className="border-line-soft border-b pb-2.5">
          <dt className="text-ink-faint text-[11px] font-bold">{f.labelHe}</dt>
          <dd className="text-ink mt-0.5 text-sm whitespace-pre-wrap">
            {fmt(f.value)}
            {f.unit && f.value != null ? ` ${f.unit}` : ""}
          </dd>
        </div>
      ))}
    </dl>
  );
}
