import type { Metadata } from "next";
import { requireTherapist, getDisplayName } from "@/modules/core/auth/server";
import { getAccountInfo } from "@/modules/core/auth";
import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/modules/core/design-system";
import { ChangePasswordForm, TotpEnroll } from "./settings-forms";

export const metadata: Metadata = { title: "הגדרות — נופר" };

const SOON = ["פרטי הקליניקה והמיתוג", "מדיניות שמירת מידע ונספח רגולציה"];

export default async function SettingsPage() {
  const session = await requireTherapist();
  const [name, acc] = await Promise.all([getDisplayName(session), getAccountInfo(session.userId)]);

  return (
    <div className="max-w-2xl space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">הגדרות</h1>
        <p className="text-ink-soft text-sm">חשבון ואבטחה.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>חשבון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <Row label="שם" value={name} />
          <Row label="דוא״ל" value={acc?.email ?? "—"} />
          <Row label="אימות דו־שלבי" value={acc?.totpEnabled ? "פעיל" : "כבוי"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>החלפת סיסמה</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>אימות דו־שלבי</CardTitle>
        </CardHeader>
        <CardContent>
          <TotpEnroll enabled={acc?.totpEnabled ?? false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>בקרוב</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-[13px]">
          {SOON.map((s) => (
            <p key={s} className="text-ink-soft flex items-center gap-2">
              <Icon name="clock" size={14} className="text-ink-faint" /> {s}
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex justify-between gap-3">
      <span className="text-ink-faint">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
