import { STATUS_LABEL, type PatientStatus } from "@/modules/patients";
import { cn } from "@/modules/core/design-system";

const CLS: Record<PatientStatus, string> = {
  active: "bg-sage-soft text-sage-deep",
  paused: "bg-amber-soft text-amber-ink",
  completed: "bg-line-soft text-ink-soft",
  inactive: "bg-[#f0eee9] text-ink-faint",
};

/** Status chip for a patient — shared by the list and the file screens. */
export function StatusPill({ status }: { status: PatientStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold", CLS[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}
