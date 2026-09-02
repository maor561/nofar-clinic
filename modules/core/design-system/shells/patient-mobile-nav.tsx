"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "../icon";
import type { NavItem } from "./shell-nav";

/** hrefs that get a fixed slot in the bottom bar; the rest go into "עוד". */
const PRIMARY = ["/p", "/p/appointments", "/p/tasks", "/p/questionnaire"];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    if (href === "/p") return pathname === "/p";
    return pathname === href || pathname.startsWith(href + "/");
  };
}

/**
 * App-style bottom navigation for the patient on phones (WP-68). Portrait-first.
 * Four fixed destinations + a "עוד" sheet with everything else, the push toggle
 * and logout. Hidden from `md` up, where the top nav takes over.
 */
export function PatientMobileNav({
  items,
  pushSlot,
  logoutSlot,
}: {
  items: NavItem[];
  pushSlot?: React.ReactNode;
  logoutSlot?: React.ReactNode;
}) {
  const isActive = useIsActive();
  const [sheet, setSheet] = useState(false);

  const primary = PRIMARY.map((h) => items.find((i) => i.href === h)).filter(
    (i): i is NavItem => !!i,
  );
  const rest = items.filter((i) => !PRIMARY.includes(i.href));
  const moreActive = rest.some((i) => isActive(i.href));

  return (
    <>
      {sheet && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSheet(false)}
          aria-hidden
        />
      )}
      <div
        role="dialog"
        aria-label="עוד"
        className={cn(
          "bg-surface border-line fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t p-4 transition-transform duration-200 md:hidden",
          sheet ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
      >
        <div className="bg-ink-faint/25 mx-auto mb-3 h-1 w-9 rounded-full" />
        <div className="grid grid-cols-2 gap-2">
          {rest.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              onClick={() => setSheet(false)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold",
                isActive(i.href) ? "bg-sage-soft text-sage-deep" : "bg-surface-2 text-ink-soft",
              )}
            >
              <Icon name={i.icon} size={19} />
              {i.label}
            </Link>
          ))}
        </div>
        {pushSlot && (
          <div className="bg-surface-2 mt-2 rounded-xl px-3 py-3">
            <p className="text-ink-faint mb-1.5 text-[11px] font-bold">התראות Push</p>
            {pushSlot}
          </div>
        )}
        {logoutSlot && <div className="mt-2">{logoutSlot}</div>}
      </div>

      <nav
        aria-label="ניווט"
        className="bg-surface border-line fixed inset-x-0 bottom-0 z-30 flex border-t md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primary.map((i) => (
          <Tab key={i.href} href={i.href} label={i.label} icon={i.icon} active={isActive(i.href)} />
        ))}
        <button
          type="button"
          onClick={() => setSheet((v) => !v)}
          aria-expanded={sheet}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 pt-2 pb-2.5 text-[11px] font-semibold",
            sheet || moreActive ? "text-sage-deep" : "text-ink-faint",
          )}
        >
          <Icon name="menu" size={21} />
          עוד
        </button>
      </nav>
    </>
  );
}

function Tab({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center gap-0.5 border-t-2 pt-1.5 pb-2.5 text-[11px] font-semibold",
        active ? "border-sage-deep text-sage-deep" : "text-ink-faint border-transparent",
      )}
    >
      <Icon name={icon} size={21} />
      {label}
    </Link>
  );
}
