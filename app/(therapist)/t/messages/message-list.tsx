import { cn } from "@/modules/core/design-system";
import type { MessageRow } from "@/modules/messaging";

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  timeZone: "Asia/Jerusalem",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Chronological message bubbles. `mine` is the viewer's own role — their
 * messages sit on the trailing (end) side, sage-tinted.
 */
export function MessageList({
  messages,
  mine,
}: {
  messages: MessageRow[];
  mine: "therapist" | "patient";
}) {
  if (messages.length === 0) {
    return (
      <p className="text-ink-faint py-10 text-center text-sm">אין הודעות עדיין. כתבו את הראשונה.</p>
    );
  }
  return (
    <div className="flex flex-col gap-2 py-2">
      {messages.map((m) => {
        const own = m.sender === mine;
        return (
          <div key={m.id} className={cn("flex", own ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                own
                  ? "bg-sage-soft text-ink rounded-ee-sm"
                  : "border-line bg-surface text-ink rounded-es-sm border",
              )}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <span className="text-ink-faint mt-1 block text-[10.5px] tabular-nums">
                {timeFmt.format(m.sentAt)}
                {own && m.readAt ? " · נקרא" : ""}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
