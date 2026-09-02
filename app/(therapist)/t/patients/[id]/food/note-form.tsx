"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/modules/core/design-system";
import { saveFoodNoteAction, type NoteState } from "./actions";

export function TherapistNoteForm({
  patientId,
  date,
  defaultNote,
}: {
  patientId: string;
  date: string;
  defaultNote: string;
}) {
  const [state, action, pending] = useActionState<NoteState, FormData>(
    saveFoodNoteAction.bind(null, patientId, date),
    {},
  );
  const router = useRouter();
  const seen = useRef(0);

  useEffect(() => {
    if (state.ok && state.ok !== seen.current) {
      seen.current = state.ok;
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-2">
      <textarea
        name="therapistNote"
        defaultValue={defaultNote}
        rows={4}
        placeholder="מה לדייק, מה טוב, מה להוסיף…"
        className="border-line bg-surface w-full rounded-lg border px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? "שומר…" : "שמירת ההערה"}
        </Button>
        {state.error && (
          <p role="alert" className="text-danger text-[13px]">
            {state.error}
          </p>
        )}
        {state.ok && <p className="text-sage-deep text-[13px]">נשמר ונשלח למטופל/ת ✓</p>}
      </div>
    </form>
  );
}
