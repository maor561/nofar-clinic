import type { Metadata } from "next";
import { getPatientDb } from "@/modules/core/authz/server";
import { listTaskRows, TASK_FREQUENCY_LABEL, type TaskRow } from "@/modules/tasks";
import { Card, EmptyState, Icon, cn } from "@/modules/core/design-system";
import { setTaskStatusAction } from "@/app/(therapist)/t/patients/[id]/tasks/actions";

export const metadata: Metadata = { title: "המשימות שלי" };

const df = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });

function range(t: TaskRow): string | null {
  if (t.startDate && t.endDate)
    return `${df.format(new Date(t.startDate))} – ${df.format(new Date(t.endDate))}`;
  if (t.endDate) return `עד ${df.format(new Date(t.endDate))}`;
  if (t.startDate) return `מ־${df.format(new Date(t.startDate))}`;
  return null;
}

export default async function MyTasksPage() {
  const pdb = await getPatientDb();
  const tasks = await listTaskRows(pdb, {});
  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">המשימות שלי</h1>
        <p className="text-ink-soft text-sm">סמנו משימה כשהיא בוצעה — נופר תראה את העדכון.</p>
      </header>

      {tasks.length === 0 ? (
        <EmptyState
          icon="task"
          title="אין משימות כרגע"
          description="כשנופר תגדיר לך משימה, היא תופיע כאן."
        />
      ) : (
        <div className="space-y-5">
          {[
            { label: "לביצוע", rows: open, target: "done" as const },
            { label: "בוצעו", rows: done, target: "open" as const },
          ].map(
            (grp) =>
              grp.rows.length > 0 && (
                <section key={grp.label} className="space-y-2">
                  <h2 className="text-ink-faint text-[11px] font-bold tracking-wide">
                    {grp.label}
                  </h2>
                  <Card className="divide-line-soft divide-y p-0">
                    {grp.rows.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 px-3.5 py-3">
                        <form action={setTaskStatusAction.bind(null, t.id, grp.target)}>
                          <button
                            type="submit"
                            aria-label={t.status === "open" ? "סימון כבוצעה" : "ביטול סימון"}
                            className={cn(
                              "mt-0.5 grid size-5 place-items-center rounded-md border transition-colors",
                              t.status === "done"
                                ? "border-sage bg-sage-soft text-sage-deep"
                                : "border-line hover:border-sage",
                            )}
                          >
                            {t.status === "done" && <Icon name="check" size={13} />}
                          </button>
                        </form>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              t.status === "done" && "text-ink-faint line-through",
                            )}
                          >
                            {t.title}
                          </p>
                          {t.description && (
                            <p className="text-ink-soft mt-0.5 text-[13px] whitespace-pre-wrap">
                              {t.description}
                            </p>
                          )}
                          <p className="text-ink-faint mt-1 flex flex-wrap gap-x-2 text-[11px]">
                            <span>{TASK_FREQUENCY_LABEL[t.frequency]}</span>
                            {range(t) && <span>· {range(t)}</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </Card>
                </section>
              ),
          )}
        </div>
      )}
    </div>
  );
}
