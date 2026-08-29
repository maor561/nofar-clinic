import { cn } from "@/lib/utils";
import { Icon, type IconName } from "../icon";

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  /** one line telling the user what to do next — not just "no data" */
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon = "leaf",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-line bg-surface-2 flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <span className="bg-sage-soft text-sage-deep grid size-12 place-items-center rounded-full">
        <Icon name={icon} size={22} />
      </span>
      <div className="space-y-1">
        <p className="text-ink font-[family-name:var(--font-display)] text-base font-semibold">
          {title}
        </p>
        {description && <p className="text-ink-soft mx-auto max-w-sm text-[13px]">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
