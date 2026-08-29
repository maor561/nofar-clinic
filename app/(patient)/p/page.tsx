import { requirePatient, getDisplayName } from "@/modules/core/auth/server";
import { EmptyState } from "@/modules/core/design-system";

export default async function PatientDashboard() {
  const session = await requirePatient();
  const name = await getDisplayName(session);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          שלום {name.split(" ")[0]}
        </h1>
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
