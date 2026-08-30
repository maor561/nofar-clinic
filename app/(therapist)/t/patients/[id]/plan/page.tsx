import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getPatient } from "@/modules/patients";
import { getPlan, listPlanVersions } from "@/modules/plans";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Icon,
} from "@/modules/core/design-system";

export const metadata: Metadata = { title: "תוכנית טיפול — נופר" };

const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium", timeStyle: "short" });

export default async function PlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const view = await getPlan(tdb, id);
  const versions = view ? await listPlanVersions(tdb, id) : [];

  await audit("view", "treatment_plan", { patientId: id, entityId: view?.plan.id });

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>

      <header className="border-line flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            תוכנית טיפול · {p.firstName} {p.lastName}
          </h1>
          {view?.current && (
            <p className="text-ink-soft mt-1 text-sm">
              גרסה {view.current.versionNo} · עודכנה {dtf.format(view.current.createdAt)}
            </p>
          )}
        </div>
        <Button asChild>
          <Link href={`/t/patients/${id}/plan/edit`}>
            <Icon name="plan" size={16} /> {view ? "עדכון תוכנית" : "יצירת תוכנית"}
          </Link>
        </Button>
      </header>

      {!view || !view.current ? (
        <EmptyState
          icon="plan"
          title="אין עדיין תוכנית טיפול"
          description="צרו את הגרסה הראשונה — תזונה, תוספים, אורח חיים ויעדים. כל שינוי עתידי נשמר כגרסה חדשה."
          action={
            <Button asChild size="sm">
              <Link href={`/t/patients/${id}/plan/edit`}>יצירת תוכנית</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
          <div className="space-y-4">
            {view.current.note && (
              <p className="bg-sage-soft/40 text-ink-soft rounded-[10px] px-3 py-2 text-[13px]">
                <b className="text-ink">עדכון אחרון:</b> {view.current.note}
              </p>
            )}
            {view.current.fields.length === 0 ? (
              <p className="text-ink-faint text-sm">הגרסה הנוכחית ריקה.</p>
            ) : (
              view.current.fields.map((f) => (
                <Card key={f.definitionId}>
                  <CardHeader>
                    <CardTitle>{f.labelHe}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-ink text-sm whitespace-pre-wrap">
                    {String(f.value ?? "").trim() || "—"}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <aside>
            <Card>
              <CardHeader>
                <CardTitle>היסטוריית גרסאות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5 text-[13px]">
                {versions.map((v) => (
                  <Link
                    key={v.id}
                    href={`/t/patients/${id}/plan/v/${v.id}`}
                    className="hover:bg-surface-2 -mx-1.5 flex items-baseline justify-between gap-2 rounded-md px-1.5 py-1"
                  >
                    <span className="font-semibold">
                      גרסה {v.versionNo}
                      {v.id === view.plan.currentVersionId && (
                        <span className="text-sage-deep"> · נוכחית</span>
                      )}
                    </span>
                    <span className="text-ink-faint tabular-nums">
                      {new Intl.DateTimeFormat("he-IL", { dateStyle: "short" }).format(v.createdAt)}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
