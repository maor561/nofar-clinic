import { requireTherapist, getDisplayName } from "@/modules/core/auth/server";
import { EmptyState } from "@/modules/core/design-system";

export default async function TherapistDashboard() {
  const session = await requireTherapist();
  const name = await getDisplayName(session);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          בוקר טוב, {name.split(" ")[0]}
        </h1>
        <p className="text-ink-soft text-sm">
          {new Date().toLocaleDateString("he-IL", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </header>

      <EmptyState
        icon="grid"
        title="הדשבורד ייבנה ב-WP-20"
        description="ההתחברות, ה-shell וה-guard עובדים. הדשבורד המלא (פגישות היום, מטופלים, התראות) מגיע בהמשך."
      />
    </div>
  );
}
