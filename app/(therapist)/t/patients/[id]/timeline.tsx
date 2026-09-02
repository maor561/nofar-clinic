import { Icon, type IconName, EmptyState } from "@/modules/core/design-system";
import { TIMELINE_LABEL, type TimelineEntry, type TimelineEventType } from "@/modules/patient-file";

const TIMELINE_ICON: Record<TimelineEventType, IconName> = {
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

const dayFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "full" });
const timeFmt = new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" });

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function relativeDay(d: Date, now: Date): string {
  const oneDay = 864e5;
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / oneDay);
  if (diff === 0) return "היום";
  if (diff === 1) return "אתמול";
  return dayFmt.format(d);
}

/**
 * Read-only patient timeline (WP-11). Entries arrive newest-first; we group them
 * under day headers and draw a single rail down the column.
 */
export function PatientTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon="clock"
        title="אין אירועים"
        description="פגישות, מפגשים, תוכניות, משימות ומסמכים יופיעו כאן כרונולוגית."
      />
    );
  }

  // server render — "today" is per-request and only drives the day labels
  const now = new Date();
  const groups: { key: string; label: string; items: TimelineEntry[] }[] = [];
  for (const e of entries) {
    const d = new Date(e.occurredAt);
    const key = dayKey(d);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(e);
    else groups.push({ key, label: relativeDay(d, now), items: [e] });
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="text-ink-faint mb-2 text-[11px] font-bold tracking-wide">{g.label}</h3>
          <ol className="border-line relative space-y-3 border-s ps-5">
            {g.items.map((e) => (
              <li key={e.id} className="relative">
                <span className="bg-sage-soft text-sage-deep absolute -start-[2.05rem] grid size-6 place-items-center rounded-full ring-4 ring-[var(--surface,#fff)]">
                  <Icon name={TIMELINE_ICON[e.type]} size={13} />
                </span>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-ink text-sm">{e.summary}</p>
                  <time
                    dateTime={new Date(e.occurredAt).toISOString()}
                    className="text-ink-faint shrink-0 text-[11px] tabular-nums"
                  >
                    {timeFmt.format(new Date(e.occurredAt))}
                  </time>
                </div>
                <span className="text-ink-faint text-[11px]">{TIMELINE_LABEL[e.type]}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
