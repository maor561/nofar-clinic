import { getPatientDb } from "@/modules/core/authz/server";
import { EmptyState } from "@/modules/core/design-system";

export default async function PatientDashboard() {
  // Every read of patient data goes through the scoping guard (WP-03).
  const pdb = await getPatientDb();
  const me = await pdb.self();
  const first = me?.firstName ?? "מיכל";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">שלום {first}</h1>
        <p className="text-ink-soft text-sm">הנה מה שחשוב להיום.</p>
      </header>

      <EmptyState
        icon="grid"
        title="הדשבורד שלך ייבנה ב-WP-19"
        description="נכנסת בהצלחה. הפגישה הבאה, המשימות והעדכונים מנופר יופיעו כאן."
      />
    </div>
  );
}
