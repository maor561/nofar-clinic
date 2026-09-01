import type { Metadata } from "next";
import { getPatientDb } from "@/modules/core/authz/server";
import { listSharedSummaries } from "@/modules/sessions";
import { Card, EmptyState } from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";

export const metadata: Metadata = { title: "המפגשים שלי" };

const dateFmt = clinicDateFmt({ dateStyle: "long" });

export default async function MySessionsPage() {
  const pdb = await getPatientDb();
  const sessions = await listSharedSummaries(pdb);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">המפגשים שלי</h1>
        <p className="text-ink-soft text-sm">סיכומים שנופר בחרה לשתף איתך לאחר המפגשים.</p>
      </header>

      {sessions.length === 0 ? (
        <EmptyState
          icon="leaf"
          title="אין סיכומים עדיין"
          description="אחרי מפגש שבו נופר תכתוב סיכום עבורך, הוא יופיע כאן."
        />
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li key={s.id}>
              <Card className="space-y-2 p-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold">
                    {dateFmt.format(new Date(`${s.date}T12:00:00Z`))}
                  </span>
                  {s.treatmentTypes.map((t) => (
                    <span
                      key={t}
                      className="bg-sage-soft text-sage-deep rounded-full px-2 py-0.5 text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-ink text-sm whitespace-pre-wrap">{s.summary}</p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
