import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatient } from "@/modules/patients";
import { listSessions } from "@/modules/sessions";
import { Button, Card, EmptyState, Icon } from "@/modules/core/design-system";

export const metadata: Metadata = { title: "מפגשים" };

const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "full" });

function excerpt(s: {
  treatmentDone: string | null;
  patientReport: string | null;
  complaints: string | null;
}): string | null {
  const raw = (s.treatmentDone || s.patientReport || s.complaints || "").trim();
  if (!raw) return null;
  return raw.length > 140 ? `${raw.slice(0, 140)}…` : raw;
}

export default async function PatientSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const sessions = await listSessions(tdb, { patientId: id, limit: 200 });

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            מפגשים — {p.firstName} {p.lastName}
          </h1>
          <p className="text-ink-soft text-sm">{sessions.length} מפגשים מתועדים, מהחדש לישן.</p>
        </div>
        <Button asChild size="sm">
          <Link href={`/t/sessions/new?patient=${id}`}>
            <Icon name="plus" size={16} /> תיעוד מפגש חדש
          </Link>
        </Button>
      </header>

      {sessions.length === 0 ? (
        <EmptyState
          icon="leaf"
          title="אין מפגשים מתועדים"
          description="לאחר תיעוד המפגש הראשון, כל המפגשים יופיעו כאן."
          action={
            <Button asChild size="sm">
              <Link href={`/t/sessions/new?patient=${id}`}>תיעוד מפגש חדש</Link>
            </Button>
          }
        />
      ) : (
        <Card className="divide-line-soft divide-y p-0">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/t/sessions/${s.id}`}
              className="hover:bg-surface-2 block px-4 py-3 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold">{dateFmt.format(new Date(s.date))}</span>
                {s.treatmentTypes.map((t) => (
                  <span
                    key={t}
                    className="bg-sage-soft text-sage-deep rounded-md px-2 py-0.5 text-[11px] font-semibold"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {excerpt(s) && (
                <p className="text-ink-soft mt-1 line-clamp-2 text-[13px]">{excerpt(s)}</p>
              )}
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
