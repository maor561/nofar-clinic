import { APPT_STATUS_LABEL, type AppointmentStatus } from "@/modules/appointments";
import { cn } from "@/modules/core/design-system";

const CLS: Record<AppointmentStatus, string> = {
  scheduled: "bg-sage-soft text-sage-deep",
  done: "bg-line-soft text-ink-soft",
  cancelled: "bg-[#f0eee9] text-ink-faint line-through",
  no_show: "bg-amber-soft text-amber-ink",
};

export function ApptStatus({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold", CLS[status])}
    >
      {APPT_STATUS_LABEL[status]}
    </span>
  );
}
