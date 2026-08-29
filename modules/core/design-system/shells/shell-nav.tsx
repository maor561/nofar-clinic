"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "../icon";

export type NavItem = {
  label: string;
  icon: IconName;
  href: string;
  badge?: number;
};
export type NavGroup = { label: string; items: NavItem[] };

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => {
    const base = href.split("/").slice(0, 2).join("/"); // "/t" or "/p"
    if (href === base) return pathname === base;
    return pathname === href || pathname.startsWith(href + "/");
  };
}

/** Right-hand side rail (therapist). */
export function RailNav({ groups }: { groups: NavGroup[] }) {
  const isActive = useIsActive();
  return (
    <>
      {groups.map((group) => (
        <div key={group.label} className="contents">
          <span className="text-ink-faint px-2.5 pt-3.5 pb-1.5 text-[11px] font-bold tracking-[0.08em] max-md:hidden">
            {group.label}
          </span>
          {group.items.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-sage-soft text-sage-deep"
                    : "text-ink-soft hover:bg-sage-tint hover:text-ink",
                )}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="bg-blush ms-auto grid h-[19px] min-w-[19px] place-items-center rounded-full px-1.5 text-[11.5px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </>
  );
}

/** Top horizontal nav (patient). */
export function TopNav({ items }: { items: NavItem[] }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="ניווט" className="flex flex-wrap gap-0.5">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold transition-colors",
              active
                ? "bg-sage-soft text-sage-deep"
                : "text-ink-soft hover:bg-sage-tint hover:text-ink",
            )}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
            {item.badge ? (
              <span className="bg-blush grid h-[17px] min-w-[17px] place-items-center rounded-full px-1 text-[11px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
