import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listThreads } from "@/modules/messaging";
import { listPatients } from "@/modules/patients";
import { Card, EmptyState, cn } from "@/modules/core/design-system";
import { ChatPoller } from "./chat";

export const metadata: Metadata = { title: "הודעות" };

const dtf = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  dateStyle: "short",
  timeStyle: "short",
});

export default async function MessagesInboxPage() {
  if (!FEATURES.messaging) notFound();

  const tdb = await getTherapistDb();
  const threads = await listThreads(tdb);

  // patients with no thread yet — so the therapist can open a new conversation
  const withThread = new Set(threads.map((t) => t.patientId));
  const others = (await listPatients(tdb, { limit: 200 })).filter((p) => !withThread.has(p.id));

  return (
    <div className="space-y-5">
      <ChatPoller ms={20000} />
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">הודעות</h1>
        <p className="text-ink-soft text-sm">שיחות עם המטופלים/ות.</p>
      </header>

      {threads.length === 0 && others.length === 0 ? (
        <EmptyState icon="chat" title="אין שיחות" description="הוסיפו מטופל/ת כדי להתחיל שיחה." />
      ) : (
        <>
          {threads.length > 0 && (
            <Card className="divide-line-soft divide-y p-0">
              {threads.map((t) => (
                <Link
                  key={t.id}
                  href={`/t/messages/${t.patientId}`}
                  className="hover:bg-surface-2 flex items-center gap-3 px-4 py-3 transition-colors"
                >
                  <span className="bg-sage-soft text-sage-deep grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold">
                    {t.patientName
                      .split(" ")
                      .map((s) => s[0])
                      .join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{t.patientName}</span>
                      <span className="text-ink-faint shrink-0 text-[11px] tabular-nums">
                        {dtf.format(t.lastMessageAt)}
                      </span>
                    </span>
                    <span className="text-ink-soft mt-0.5 block truncate text-[13px]">
                      {t.lastSender === "therapist" && "את/ה: "}
                      {t.lastBody ?? "—"}
                    </span>
                  </span>
                  {t.unread > 0 && (
                    <span className="bg-sage text-surface grid min-w-5 shrink-0 place-items-center rounded-full px-1 text-[11px] font-bold">
                      {t.unread}
                    </span>
                  )}
                </Link>
              ))}
            </Card>
          )}

          {others.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-ink-faint text-[11px] font-bold tracking-wide">התחלת שיחה</h2>
              <div className="flex flex-wrap gap-1.5">
                {others.map((p) => (
                  <Link
                    key={p.id}
                    href={`/t/messages/${p.id}`}
                    className={cn(
                      "border-line text-ink-soft hover:border-sage rounded-full border px-3 py-1 text-[12.5px] font-semibold",
                    )}
                  >
                    {p.firstName} {p.lastName}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
