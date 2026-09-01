"use client";

import { useActionState, useState } from "react";
import { Button, Input } from "@/modules/core/design-system";
import { deletePatientAction } from "../../actions";
import type { PatientFormState } from "../../patient-form";

export function DeletePatientCard({ id, fullName }: { id: string; fullName: string }) {
  const action = deletePatientAction.bind(null, id);
  const [state, formAction, pending] = useActionState<PatientFormState, FormData>(action, {});
  const [ack, setAck] = useState(false);
  const [typed, setTyped] = useState("");

  const armed = ack && typed.trim() === fullName;

  return (
    <div className="border-danger/40 bg-danger-soft/30 space-y-3 rounded-xl border p-4">
      <div>
        <h2 className="text-danger font-[family-name:var(--font-display)] text-lg font-bold">
          מחיקת המטופל/ת לצמיתות
        </h2>
        <p className="text-ink-soft mt-1 text-[13px]">
          פעולה <b>בלתי הפיכה</b>. נמחקים המטופל/ת, כל המפגשים, התוכניות, המשימות, הפגישות, המסמכים
          (כולל הקבצים), הגישה שלו/ה למערכת, וכל שאר הרשומות. נשמר רק רישום ביומן הביקורת (מטא-דאטה
          בלבד, ללא תוכן קליני). ודא/י שיש לך אישור והבנה של חובות שמירת רשומות החלות עליך — מומלץ
          להתייעץ עם עו״ד.
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <label className="flex items-start gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            className="mt-0.5 size-3.5"
          />
          אני מבין/ה שהמחיקה סופית ולא ניתנת לשחזור.
        </label>

        <div className="grid max-w-sm gap-1.5">
          <label htmlFor="confirmName" className="text-ink-faint text-[12px] font-semibold">
            להקלדה לאישור: <span className="text-ink">{fullName}</span>
          </label>
          <Input
            id="confirmName"
            name="confirmName"
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>

        {state.error && (
          <p role="alert" className="text-danger text-[13px]">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={!armed || pending}
          className="border-danger text-danger hover:bg-danger hover:text-white"
        >
          {pending ? "מוחק…" : "מחיקה לצמיתות"}
        </Button>
      </form>
    </div>
  );
}
