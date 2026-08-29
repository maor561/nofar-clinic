import { cn } from "@/lib/utils";
import { Icon } from "../icon";

type ErrorStateProps = {
  /** what went wrong, in plain Hebrew */
  title?: string;
  /** how to recover */
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function ErrorState({
  title = "משהו השתבש",
  description = "לא הצלחנו לטעון את המידע. נסו לרענן, ואם זה חוזר — פנו לתמיכה.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border-danger-soft bg-danger-soft/50 flex flex-col items-center gap-3 rounded-[var(--radius-card)] border px-6 py-12 text-center",
        className,
      )}
    >
      <span className="bg-danger-soft text-danger grid size-12 place-items-center rounded-full">
        <Icon name="info" size={22} />
      </span>
      <div className="space-y-1">
        <p className="text-ink font-[family-name:var(--font-display)] text-base font-semibold">
          {title}
        </p>
        <p className="text-ink-soft mx-auto max-w-sm text-[13px]">{description}</p>
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
