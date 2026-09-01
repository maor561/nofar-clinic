import Link from "next/link";
import { getPatientDb } from "@/modules/core/authz/server";
import { listAppointmentRows } from "@/modules/appointments";
import { listTaskRows } from "@/modules/tasks";
import { listTimeline, TIMELINE_LABEL, type TimelineEventType } from "@/modules/patient-file";
import { getQuestionnaire } from "@/modules/questionnaires";
import { treatmentLabel } from "@/modules/appointments";
import { getActivePatientSeries } from "@/modules/patients";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  type IconName,
} from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";

export const metadata = { title: "המרחב שלי" };

const whenFmt = clinicDateFmt({
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});
const dayFmt = clinicDateFmt({ day: "2-digit", month: "2-digit" });

const TL_ICON: Record<TimelineEventType, IconName> = {
  appointment: "calendar",
  session: "leaf",
  plan_changed: "plan",
  task_created: "task",
  task_completed: "task-done",
  document_added: "doc",
  message: "chat",
  questionnaire_submitted: "form",
  status_changed: "status",
};

export default async function PatientDashboard() {
  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return null;

  // "now" for splitting upcoming appointments — per request
  const now = new Date();

  const [appts, openTasks, updates, questionnaire, series] = await Promise.all([
    listAppointmentRows(pdb, { from: now, status: "scheduled", ascending: true, limit: 1 }),
    listTaskRows(pdb, { status: "open", limit: 4 }),
    listTimeline(pdb, me.id, { limit: 4 }),
    getQuestionnaire(pdb, me.id),
    getActivePatientSeries(pdb, me.id),
  ]);
  const nextAppt = appts[0] ?? null;
  const seriesRemaining = series ? Math.max(0, series.sessionCount - series.usedCount) : 0;
  const needsQuestionnaire = !questionnaire || questionnaire.response.status !== "submitted";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          שלום {me.firstName}
        </h1>
        <p className="text-ink-soft text-sm">הנה מה שחשוב לך עכשיו.</p>
      </header>

      {needsQuestionnaire && (
        <Card className="border-sage bg-sage-soft/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div>
              <p className="font-semibold">שאלון קליטה ממתין למילוי</p>
              <p className="text-ink-soft text-[13px]">כמה שאלות קצרות שיעזרו לנופר להכיר אותך.</p>
            </div>
            <Button asChild size="sm">
              <Link href="/p/questionnaire">למילוי השאלון</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {series && (
        <Card>
          <CardHeader>
            <CardTitle>סדרת הטיפול שלך</CardTitle>
            <span className="text-ink-faint text-xs">{series.name}</span>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              בוצעו <b className="tabular-nums">{series.usedCount}</b> מתוך{" "}
              <b className="tabular-nums">{series.sessionCount}</b> · נותרו{" "}
              <b className="text-sage-deep tabular-nums">{seriesRemaining}</b>
            </p>
            <div className="bg-line-soft h-2 overflow-hidden rounded-full">
              <div
                className="bg-sage h-full rounded-full"
                style={{
                  width: `${Math.min(100, (series.usedCount / series.sessionCount) * 100)}%`,
                }}
              />
            </div>
            {seriesRemaining > 0 && seriesRemaining <= 2 && (
              <p className="text-amber-ink text-[13px]">
                נותרו {seriesRemaining} מפגשים — כדאי לתאם עם נופר את ההמשך.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>הפגישה הבאה</CardTitle>
          </CardHeader>
          <CardContent>
            {nextAppt ? (
              <>
                <p className="text-sm font-semibold">{whenFmt.format(nextAppt.startsAt)}</p>
                {treatmentLabel(nextAppt.treatmentType) && (
                  <p className="text-ink-soft mt-0.5 text-[13px]">
                    {treatmentLabel(nextAppt.treatmentType)}
                  </p>
                )}
                <Link
                  href="/p/appointments"
                  className="text-sage-deep mt-2 inline-block text-[13px] hover:underline"
                >
                  כל הפגישות ←
                </Link>
              </>
            ) : (
              <p className="text-ink-faint text-sm">אין פגישה קרובה שנקבעה.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>משימות פתוחות</CardTitle>
            <span className="text-ink-faint text-xs tabular-nums">{openTasks.length}</span>
          </CardHeader>
          <CardContent>
            {openTasks.length === 0 ? (
              <p className="text-ink-faint text-sm">אין משימות פתוחות. כל הכבוד!</p>
            ) : (
              <ul className="space-y-1.5">
                {openTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-sm">
                    <span className="border-line size-3.5 shrink-0 rounded-[4px] border" />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link
              href="/p/tasks"
              className="text-sage-deep mt-2 inline-block text-[13px] hover:underline"
            >
              למשימות שלי ←
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>עדכונים אחרונים</CardTitle>
        </CardHeader>
        <CardContent>
          {updates.length === 0 ? (
            <p className="text-ink-faint text-sm">אין עדכונים עדיין.</p>
          ) : (
            <ul className="space-y-2.5">
              {updates.map((e) => (
                <li key={e.id} className="flex items-start gap-2.5">
                  <span className="bg-sage-soft text-sage-deep mt-0.5 grid size-6 shrink-0 place-items-center rounded-full">
                    <Icon name={TL_ICON[e.type]} size={13} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{e.summary}</span>
                    <span className="text-ink-faint text-[11px]">
                      {TIMELINE_LABEL[e.type]} · {dayFmt.format(e.occurredAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
