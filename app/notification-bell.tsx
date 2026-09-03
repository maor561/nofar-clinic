"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon, Popover, PopoverContent, PopoverTrigger, cn } from "@/modules/core/design-system";

type Item = {
  id: string;
  type: string;
  titleHe: string;
  bodyHe: string | null;
  link: string | null;
  createdAt: string;
  readAt: string | null;
};

const POLL_MS = 30_000;

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { count: number; items: Item[] };
      setCount(data.count);
      setItems(data.items);
    } catch {
      /* offline / transient — keep the last value */
    }
  }, []);

  useEffect(() => {
    // polling: fetch now, then on an interval
    const kick = () => void load();
    kick();
    const id = setInterval(kick, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  async function markAll() {
    await fetch("/api/notifications", { method: "POST" });
    setCount(0);
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
  }

  const dtf = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`התראות${count ? ` (${count} שלא נקראו)` : ""}`}
          className="text-ink-faint hover:bg-sage-tint hover:text-ink relative grid size-9 place-items-center rounded-lg transition-colors md:size-8"
        >
          <Icon name="bell" size={20} className="md:size-[18px]" />
          {count > 0 && (
            <span className="-inline-end-0.5 bg-blush absolute -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-line-soft flex items-center justify-between border-b px-3.5 py-2.5">
          <span className="text-sm font-bold">התראות</span>
          {count > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="text-sage-deep text-xs font-semibold hover:underline"
            >
              סמן הכל כנקרא
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {items.length === 0 ? (
            <p className="text-ink-faint px-3.5 py-8 text-center text-sm">אין התראות</p>
          ) : (
            items.map((n) => {
              const inner = (
                <div
                  className={cn(
                    "border-line-soft border-b px-3.5 py-3 last:border-b-0",
                    !n.readAt && "bg-sage-tint/60",
                  )}
                >
                  <div className="flex items-start gap-1.5">
                    {!n.readAt && (
                      <span className="bg-blush mt-1.5 size-1.5 shrink-0 rounded-full" />
                    )}
                    <div className="min-w-0">
                      <p className="text-ink text-[13px] font-semibold">{n.titleHe}</p>
                      {n.bodyHe && <p className="text-ink-soft mt-0.5 text-xs">{n.bodyHe}</p>}
                      <p className="text-ink-faint mt-1 text-[11px]">
                        {dtf.format(new Date(n.createdAt))}
                      </p>
                    </div>
                  </div>
                </div>
              );
              return n.link ? (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => setOpen(false)}
                  className="hover:bg-surface-2 block"
                >
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
