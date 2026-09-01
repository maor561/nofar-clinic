"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Label } from "@/modules/core/design-system";
import { documentKind, DOCUMENT_KIND_LABEL } from "@/modules/documents/labels";
import { ALLOWED_MIME } from "@/modules/core/files/labels";
import { shareToPatientsAction, type ShareState } from "./actions";

export type PatientOption = { id: string; name: string };

const FIELD = "border-line bg-surface h-9 rounded-lg border px-2.5 text-sm";

export function ShareForm({ patients }: { patients: PatientOption[] }) {
  const [state, action, pending] = useActionState<ShareState, FormData>(shareToPatientsAction, {});
  const [q, setQ] = useState("");
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const shown = q.trim()
    ? patients.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()))
    : patients;

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      ref={ref}
      action={action}
      className="border-line bg-surface-2 space-y-4 rounded-xl border p-4"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="share-file">קובץ</Label>
          <input
            id="share-file"
            name="file"
            type="file"
            required
            accept={ALLOWED_MIME.join(",")}
            className="text-ink-soft file:bg-sage-soft file:text-sage-deep text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-[13px] file:font-semibold"
          />
          <span className="text-ink-faint text-[11px]">PDF, תמונות, Word, טקסט — עד 15MB</span>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="share-kind">סוג</Label>
          <select id="share-kind" name="kind" defaultValue="other" className={FIELD}>
            {documentKind.map((k) => (
              <option key={k} value={k}>
                {DOCUMENT_KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-ink-soft text-xs font-bold">
          מטופלים ({patients.length}) — כל אחד מקבל עותק משלו, משותף אוטומטית
        </legend>
        {patients.length === 0 ? (
          <p className="text-ink-faint text-[13px]">אין מטופלים פעילים.</p>
        ) : (
          <>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="סינון לפי שם…"
              className={FIELD}
            />
            <div className="border-line-soft max-h-56 space-y-1 overflow-y-auto rounded-lg border p-2">
              {shown.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-0.5 text-sm">
                  <input type="checkbox" name="patientIds" value={p.id} className="size-3.5" />
                  {p.name}
                </label>
              ))}
              {shown.length === 0 && (
                <p className="text-ink-faint px-1 text-[13px]">אין תוצאה לסינון.</p>
              )}
            </div>
          </>
        )}
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || patients.length === 0}>
          {pending ? "שולח…" : "שליחה למטופלים"}
        </Button>
        {state.error && (
          <p role="alert" className="text-danger text-[13px]">
            {state.error}
          </p>
        )}
        {state.ok ? (
          <p className="text-sage-deep text-[13px]">נשלח ל־{state.ok} מטופלים ✓</p>
        ) : null}
      </div>
    </form>
  );
}
