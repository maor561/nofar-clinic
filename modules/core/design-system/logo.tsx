import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type LogoProps = {
  /** show the wordmark next to the mark */
  withWordmark?: boolean;
  /** small caption under the wordmark */
  subtitle?: string;
  className?: string;
};

export function Logo({ withWordmark = true, subtitle, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mark.png" alt="" aria-hidden className="size-9 rounded-[11px] object-cover" />
      {withWordmark && (
        <span className="leading-tight">
          <span className="text-ink block font-[family-name:var(--font-display)] text-lg font-bold">
            {BRAND}
          </span>
          {subtitle && (
            <span className="text-ink-faint block text-[11.5px] font-semibold">{subtitle}</span>
          )}
        </span>
      )}
    </div>
  );
}
