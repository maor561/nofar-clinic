import type { Metadata } from "next";
import { getPatientDb } from "@/modules/core/authz/server";
import { getPlan } from "@/modules/plans";
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/modules/core/design-system";

export const metadata: Metadata = { title: "התוכנית שלי" };

const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "long" });

export default async function MyPlanPage() {
  const pdb = await getPatientDb();
  const me = await pdb.self();
  const view = me ? await getPlan(pdb, me.id) : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">התוכנית שלי</h1>
        <p className="text-ink-soft text-sm">
          התוכנית העדכנית שקבעה עבורך נופר. עדכונים יישלחו אליך בהתראה.
        </p>
      </header>

      {!view || !view.current ? (
        <EmptyState
          icon="plan"
          title="עדיין אין תוכנית"
          description="לאחר המפגש הראשון תופיע כאן תוכנית הטיפול שלך."
        />
      ) : (
        <div className="space-y-4">
          <p className="text-ink-faint text-[13px]">עודכנה {dtf.format(view.current.createdAt)}</p>
          {view.current.fields.length === 0 ? (
            <p className="text-ink-faint text-sm">התוכנית תעודכן בקרוב.</p>
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
      )}
    </div>
  );
}
