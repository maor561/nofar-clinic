import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatient } from "@/modules/patients";
import { sessionFieldDefs } from "@/modules/sessions";
import type { FieldSchema } from "@/modules/core/fields";
import { toClinicFields } from "@/lib/tz";
import { SessionForm, type SessionFieldDef } from "../session-form";
import { createSessionAction } from "../actions";

export const metadata: Metadata = { title: "מפגש חדש — נופר" };

type SP = { patient?: string; appointment?: string };

export default async function NewSessionPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const patientId = sp.patient ?? "";
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, patientId);
  if (!p) notFound();

  const defs = await sessionFieldDefs(tdb);
  const fieldDefs: SessionFieldDef[] = defs.map((d) => ({
    definitionId: d.id,
    key: d.key,
    labelHe: d.labelHe,
    type: d.type,
    unit: d.unit,
    schema: d.schema as FieldSchema,
  }));

  const action = createSessionAction.bind(null, patientId, sp.appointment ?? null);
  // server render — default the session date to today
  const today = toClinicFields(new Date()).date;

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${patientId}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        תיעוד מפגש — {p.firstName} {p.lastName}
      </h1>
      <SessionForm
        action={action}
        fieldDefs={fieldDefs}
        patientName={`${p.firstName} ${p.lastName}`}
        submitLabel="שמירת המפגש"
        values={{ date: today }}
      />
    </div>
  );
}
