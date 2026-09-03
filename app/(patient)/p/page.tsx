import Link from "next/link";
import { getPatientDb } from "@/modules/core/authz/server";
import { listAppointmentRows, treatmentLabel } from "@/modules/appointments";
import { listTaskRows } from "@/modules/tasks";
import { listTimeline, TIMELINE_LABEL, type TimelineEventType } from "@/modules/patient-file";
import { countOpenQuestionnaires } from "@/modules/questionnaires";
import { getActivePatientSeries } from "@/modules/patients";
import { countLoggedDays } from "@/modules/food-log";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  type IconName,
} from "@/modules/core/design-system";
import { clinicDateFmt, clinicWeekStart, toClinicFields } from "@/lib/tz";
import { PatientKpis, type SmartPrompt } from "./patient-kpis";

export const metadata = { title: "המרחב שלי" };

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
  food_log: "leaf",
};

export default async function PatientDashboard() {
  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return null;

  const now = new Date();
  const todayStr = toClinicFields(now).date;
  const weekStartStr = toClinicFields(clinicWeekStart(now)).date;

  const [appts, openTaskRows, updates, openQuestionnaires, series, foodWeek, foodToday] =
    await Promise.all([
      listAppointmentRows(pdb, { from: now, status: "scheduled", ascending: true, limit: 1 }),
      listTaskRows(pdb, { status: "open", limit: 200 }),
      listTimeline(pdb, me.id, { limit: 4 }),
      countOpenQuestionnaires(pdb, me.id),
      getActivePatientSeries(pdb, me.id),
      countLoggedDays(pdb, me.id, weekStartStr, todayStr),
      countLoggedDays(pdb, me.id, todayStr, todayStr),
    ]);

  const nextAppt = appts[0] ?? null;
  const needsQuestionnaire = openQuestionnaires > 0;

  const seriesRemaining = series ? Math.max(0, series.sessionCount - series.usedCount) : 0;
  const tasksOverdue = openTaskRows.filter((t) => t.endDate && t.endDate < todayStr).length;
  const tasksDueToday = openTaskRows.filter((t) => t.endDate === todayStr).length;
  const foodLoggedToday = foodToday > 0;

  // One prioritised nudge for the "smart" line — most urgent thing first.
  const smart: SmartPrompt =
    tasksOverdue > 0
      ? {
          text:
            tasksOverdue === 1 ? "יש לך משימה אחת באיחור." : `יש לך ${tasksOverdue} משימות באיחור.`,
          cta: "למשימות",
          href: "/p/tasks",
        }
      : series && seriesRemaining > 0 && seriesRemaining <= 2
        ? {
            text: `נותרו לך ${seriesRemaining} טיפולים בסדרה — כדאי לתאם את ההמשך.`,
            cta: "קביעת תור",
            href: "/p/appointments/new",
          }
        : tasksDueToday > 0
          ? {
              text:
                tasksDueToday === 1
                  ? "יש לך משימה אחת להיום."
                  : `יש לך ${tasksDueToday} משימות להיום.`,
              cta: "למשימות",
              href: "/p/tasks",
            }
          : !foodLoggedToday
            ? {
                text: "עוד לא עדכנת את יומן האכילה היום.",
                cta: "עדכון",
                href: "/p/food",
              }
            : null;

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
              <p className="font-semibold">
                {openQuestionnaires === 1
                  ? "שאלון ממתין למילוי"
                  : `${openQuestionnaires} שאלונים ממתינים למילוי`}
              </p>
              <p className="text-ink-soft text-[13px]">כמה שאלות קצרות שיעזרו לנופר להכיר אותך.</p>
            </div>
            <Button asChild size="sm">
              <Link href="/p/questionnaire">למילוי</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <PatientKpis
        now={now}
        series={series}
        openTasks={openTaskRows.length}
        tasksDueToday={tasksDueToday}
        tasksOverdue={tasksOverdue}
        nextAppt={
          nextAppt
            ? {
                startsAt: nextAppt.startsAt,
                treatmentLabel: treatmentLabel(nextAppt.treatmentType) || null,
              }
            : null
        }
        foodWeek={foodWeek}
        foodLoggedToday={foodLoggedToday}
        smart={smart}
      />

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
                    <Icon name={TL_ICON[e.type]} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm">{e.summary}</span>
                    <span className="text-ink-faint text-xs">
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
