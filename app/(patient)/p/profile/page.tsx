import type { Metadata } from "next";
import { getPatientDb } from "@/modules/core/authz/server";
import { getMyProfile, CONSENT_LABEL } from "@/modules/patients";
import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/modules/core/design-system";
import { PushToggle } from "@/modules/core/push/push-toggle";

export const metadata: Metadata = { title: "הפרופיל שלי" };

const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "long" });

export default async function ProfilePage() {
  const pdb = await getPatientDb();
  const me = await getMyProfile(pdb);
  if (!me) return null;

  const rows: [string, string | null][] = [
    ["שם מלא", `${me.firstName} ${me.lastName}`],
    ["תאריך לידה", me.dob ? dateFmt.format(new Date(me.dob)) : null],
    ["טלפון", me.phone],
    ["דוא״ל", me.email],
    ["כתובת", me.address],
    ["הצטרפת", dateFmt.format(new Date(me.joinedAt))],
  ];

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">הפרופיל שלי</h1>
        <p className="text-ink-soft text-sm">הפרטים שנופר רשמה. לעדכון — שלחו לה הודעה.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>פרטים אישיים</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2.5 text-sm">
              {rows.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-ink-faint">{label}</dt>
                  <dd className="text-ink text-end font-medium">{value ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>תחומי ליווי</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {me.treatmentTypes.length === 0 ? (
                <span className="text-ink-faint text-sm">—</span>
              ) : (
                me.treatmentTypes.map((t) => (
                  <span
                    key={t}
                    className="bg-sage-soft text-sage-deep rounded-md px-2 py-0.5 text-[12px] font-semibold"
                  >
                    {t}
                  </span>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>הסכמות שנתת</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-[13px]">
              {me.consents.length === 0 ? (
                <span className="text-ink-faint">לא נרשמו הסכמות</span>
              ) : (
                me.consents.map((k) => (
                  <p key={k} className="text-sage-deep flex items-start gap-2">
                    <Icon name="task-done" size={15} className="mt-0.5" /> {CONSENT_LABEL[k]}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {me.treatmentGoal && (
        <Card>
          <CardHeader>
            <CardTitle>יעד הליווי</CardTitle>
          </CardHeader>
          <CardContent className="text-ink text-sm">{me.treatmentGoal}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>התראות Push</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-ink-soft">
            קבלו התראה על פגישות, משימות וסיכומים גם כשהאפליקציה סגורה. אפשר להוסיף את המרחב למסך
            הבית (שיתוף → הוספה למסך הבית) ולהשתמש בו כאפליקציה.
          </p>
          <PushToggle />
        </CardContent>
      </Card>
    </div>
  );
}
