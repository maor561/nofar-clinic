"use client";

import { Icon } from "@/modules/core/design-system";
import type { DayBlocks } from "./appointment-form";

const PX_PER_MIN = 0.75; // 45px per hour

function hhmm(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && aE > bS;

export function DayTimeline({
  dayBlocks,
  date,
  time,
  durationMin,
}: {
  dayBlocks: DayBlocks[];
  date: string;
  time: string;
  durationMin: number;
}) {
  if (!date) {
    return (
      <div className="border-line text-ink-faint rounded-lg border border-dashed px-3 py-6 text-center text-[13px]">
        בחרו תאריך כדי לראות את היום ואת החלונות התפוסים.
      </div>
    );
  }

  const day = dayBlocks.find((b) => b.date === date);
  const items = day?.items ?? [];

  const tm = /^(\d{1,2}):(\d{2})$/.exec(time);
  const selStart = tm ? Number(tm[1]) * 60 + Number(tm[2]) : null;
  const selEnd = selStart != null ? selStart + durationMin : null;

  const marks: number[] = [8 * 60, 19 * 60, ...items.flatMap((i) => [i.startMin, i.endMin])];
  if (selStart != null) marks.push(selStart);
  if (selEnd != null) marks.push(selEnd);

  const lo = Math.max(0, Math.floor(Math.min(...marks) / 60) * 60);
  const hi = Math.min(1440, Math.ceil(Math.max(...marks) / 60) * 60);
  const height = (hi - lo) * PX_PER_MIN;

  const hours: number[] = [];
  for (let h = lo; h <= hi; h += 60) hours.push(h);

  const clash =
    selStart != null && selEnd != null
      ? items.find((i) => overlaps(selStart, selEnd, i.startMin, i.endMin))
      : undefined;

  return (
    <div className="border-line bg-surface max-w-xl rounded-lg border p-3">
      <div className="text-ink-soft mb-2 flex items-center justify-between text-[12.5px] font-semibold">
        <span>{day?.label ?? "היום שנבחר"}</span>
        {items.length === 0 && <span className="text-ink-faint font-normal">אין חסימות</span>}
      </div>

      <div className="flex gap-1" style={{ height }}>
        {/* hour labels (right side, RTL) */}
        <div className="text-ink-faint relative w-11 shrink-0 text-[11px] tabular-nums">
          {hours.map((h) => (
            <span
              key={h}
              className="absolute end-0 -translate-y-1/2"
              style={{ top: (h - lo) * PX_PER_MIN }}
            >
              {hhmm(h)}
            </span>
          ))}
        </div>

        {/* track */}
        <div className="border-line-soft bg-surface-2/40 relative flex-1 rounded-md border">
          {hours.map((h) => (
            <span
              key={h}
              className="border-line-soft absolute inset-x-0 border-t"
              style={{ top: (h - lo) * PX_PER_MIN }}
            />
          ))}

          {/* existing commitments — right lane */}
          {items.map((i, idx) => (
            <div
              key={idx}
              className={
                i.kind === "google"
                  ? "border-ink-faint/30 bg-ink-faint/15 text-ink-soft absolute end-1 w-[56%] overflow-hidden rounded border px-1.5 text-[11px] leading-tight"
                  : "border-sage/40 bg-sage-soft text-sage-deep absolute end-1 w-[56%] overflow-hidden rounded border px-1.5 text-[11px] leading-tight"
              }
              style={{
                top: (i.startMin - lo) * PX_PER_MIN + 1,
                height: Math.max(12, (i.endMin - i.startMin) * PX_PER_MIN - 2),
              }}
            >
              <span className="flex items-center gap-1 font-semibold">
                {i.kind === "google" && <Icon name="lock" size={10} />}
                {hhmm(i.startMin)}–{hhmm(i.endMin)}
              </span>
              <span className="block truncate opacity-80">{i.label}</span>
            </div>
          ))}

          {/* the appointment being scheduled — left lane */}
          {selStart != null && selEnd != null && (
            <div
              className={
                clash
                  ? "border-danger bg-danger/10 text-danger absolute start-1 z-10 w-[40%] overflow-hidden rounded border-2 border-dashed px-1.5 text-[11px] leading-tight font-bold"
                  : "border-sage-deep bg-sage/15 text-sage-deep absolute start-1 z-10 w-[40%] overflow-hidden rounded border-2 border-dashed px-1.5 text-[11px] leading-tight font-bold"
              }
              style={{
                top: (selStart - lo) * PX_PER_MIN + 1,
                height: Math.max(14, (selEnd - selStart) * PX_PER_MIN - 2),
              }}
            >
              הפגישה החדשה
              <span className="block font-normal">
                {hhmm(selStart)}–{hhmm(selEnd)}
              </span>
            </div>
          )}
        </div>
      </div>

      {clash ? (
        <p className="text-danger mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold">
          <Icon name="info" size={13} /> השעה שנבחרה חופפת ל
          {clash.kind === "google" ? "חסימה ביומן Google" : `פגישה של ${clash.label}`}.
        </p>
      ) : (
        selStart != null && <p className="text-sage-deep mt-2 text-[12.5px]">השעה שנבחרה פנויה.</p>
      )}
    </div>
  );
}
