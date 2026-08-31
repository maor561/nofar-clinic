import type { Metadata } from "next";
import { requireTherapist, getDisplayName } from "@/modules/core/auth/server";
import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/modules/core/design-system";

export const metadata: Metadata = { title: "הגדרות — נופר" };

const SOON = [
  "שינוי סיסמה",
  "אימות דו־שלבי (TOTP)",
  "פרטי הקליניקה והמיתוג",
  "מדיניות שמירת מידע ונספח רגולציה",
];

export default async function SettingsPage() {
  const session = await requireTherapist();
  const name = await getDisplayName(session);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">הגדרות</h1>
        <p className="text-ink-soft text-sm">חשבון ומערכת.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>חשבון</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p className="flex justify-between gap-3">
            <span className="text-ink-faint">שם</span>
            <span className="font-medium">{name}</span>
          </p>
          <p className="flex justify-between gap-3">
            <span className="text-ink-faint">תפקיד</span>
            <span className="font-medium">מטפלת · מנהלת</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>בקרוב (WP-20/WP-21)</CardTitle>
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
