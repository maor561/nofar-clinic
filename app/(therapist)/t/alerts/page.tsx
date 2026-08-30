import type { Metadata } from "next";
import Link from "next/link";
import { myNotifications } from "@/modules/core/notifications/server";
import { Button, Card, EmptyState, cn } from "@/modules/core/design-system";
import { markAllReadAction } from "./actions";

export const metadata: Metadata = { title: "התראות — נופר" };

export default async function AlertsPage() {
  const items = await myNotifications({ limit: 100 });
  const unread = items.filter((n) => !n.readAt).length;
  const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">התראות</h1>
          <p className="text-ink-soft text-sm">{unread > 0 ? `${unread} שלא נקראו` : "הכל נקרא"}</p>
        </div>
        {unread > 0 && (
          <form action={markAllReadAction}>
            <Button size="sm" variant="outline">
              סמן הכל כנקרא
            </Button>
          </form>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="bell"
          title="אין התראות"
          description="עדכונים על הצטרפות מטופלים, הודעות, שינויי תוכנית ועוד יופיעו כאן."
        />
      ) : (
        <Card>
          <ul>
            {items.map((n) => {
              const row = (
                <div
                  className={cn(
                    "border-line-soft flex items-start gap-2 border-b px-4 py-3 last:border-b-0",
                    !n.readAt && "bg-sage-tint/50",
                  )}
                >
                  {!n.readAt && (
                    <span className="bg-blush mt-1.5 size-1.5 shrink-0 rounded-full" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-ink text-sm font-semibold">{n.titleHe}</p>
                    {n.bodyHe && <p className="text-ink-soft mt-0.5 text-[13px]">{n.bodyHe}</p>}
                  </div>
                  <span className="text-ink-faint shrink-0 text-[11px] tabular-nums">
                    {dtf.format(new Date(n.createdAt))}
                  </span>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} className="hover:bg-surface-2 block">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
