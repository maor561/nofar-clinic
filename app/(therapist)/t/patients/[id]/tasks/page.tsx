import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getPatient } from "@/modules/patients";
import { listTaskRows, TASK_FREQUENCY_LABEL, type TaskRow } from "@/modules/tasks";
import { Button, Card, EmptyState, Icon, cn } from "@/modules/core/design-system";
import { setTaskStatusAction, deleteTaskAction } from "./actions";

export const metadata: Metadata = { title: "משימות" };

const df = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });

function range(t: TaskRow): string | null {
  if (t.startDate && t.endDate)
    return `${df.format(new Date(t.startDate))} – ${df.format(new Date(t.endDate))}`;
  if (t.endDate) return `עד ${df.format(new Date(t.endDate))}`;
  if (t.startDate) return `מ־${df.format(new Date(t.startDate))}`;
  return null;
}

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const tasks = await listTaskRows(tdb, { patientId: id });
  await audit("view", "task", { patientId: id });

  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            משימות · {p.firstName} {p.lastName}
          </h1>
          <p className="text-ink-soft text-sm">
            {open.length} פתוחות · {done.length} בוצעו
          </p>
        </div>
        <Button asChild>
          <Link href={`/t/patients/${id}/tasks/new`}>
            <Icon name="plus" size={16} /> משימה חדשה
          </Link>
        </Button>
      </header>

      {tasks.length === 0 ? (
        <EmptyState
          icon="task"
          title="אין משימות"
          description="הגדירו משימה ראשונה — המטופל/ת יראה אותה במרחב שלו ויוכל לסמן ביצוע."
          action={
            <Button asChild size="sm">
              <Link href={`/t/patients/${id}/tasks/new`}>משימה חדשה</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {[
            { label: "פתוחות", rows: open, target: "done" as const },
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
                            aria-label={t.status === "open" ? "סימון כבוצעה" : "החזרה לפתוחה"}
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
                        <div className="flex shrink-0 gap-1">
                          <Link
                            href={`/t/patients/${id}/tasks/${t.id}/edit`}
                            className="text-ink-faint hover:text-ink p-1"
                            aria-label="עריכה"
                          >
                            <Icon name="settings" size={15} />
                          </Link>
                          <form action={deleteTaskAction.bind(null, t.id, id)}>
                            <button
                              type="submit"
                              className="text-ink-faint hover:text-danger p-1"
                              aria-label="מחיקה"
                            >
                              <Icon name="x" size={15} />
                            </button>
                          </form>
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
