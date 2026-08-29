import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "../icon";
import { Logo } from "../logo";

export type NavItem = {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: number;
};

export type NavGroup = { label: string; items: NavItem[] };

const DEFAULT_GROUPS: NavGroup[] = [
  {
    label: "ניהול",
    items: [
      { key: "dashboard", label: "דשבורד", icon: "grid", href: "/t" },
      { key: "patients", label: "מטופלים", icon: "users", href: "/t/patients" },
      { key: "calendar", label: "יומן", icon: "calendar", href: "/t/calendar" },
      { key: "messages", label: "הודעות", icon: "chat", href: "/t/messages" },
    ],
  },
  {
    label: "כללי",
    items: [
      { key: "documents", label: "מסמכים", icon: "doc", href: "/t/documents" },
      { key: "alerts", label: "התראות", icon: "bell", href: "/t/alerts" },
      { key: "settings", label: "הגדרות", icon: "settings", href: "/t/settings" },
    ],
  },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

type Props = {
  activeKey: string;
  user: { name: string; role?: string };
  groups?: NavGroup[];
  children: React.ReactNode;
};

export function TherapistShell({ activeKey, user, groups = DEFAULT_GROUPS, children }: Props) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[236px_1fr]">
      <nav
        aria-label="ניווט ראשי"
        className="border-line-soft bg-surface-2 flex flex-col gap-1 border-s p-3.5 max-md:flex-row max-md:flex-wrap max-md:items-center max-md:border-s-0 max-md:border-b"
      >
        <div className="px-2 pt-1.5 pb-3.5">
          <Logo subtitle="ניהול קליניקה" />
        </div>

        {groups.map((group) => (
          <div key={group.label} className="contents">
            <span className="text-ink-faint px-2.5 pt-3.5 pb-1.5 text-[11px] font-bold tracking-[0.08em] max-md:hidden">
              {group.label}
            </span>
            {group.items.map((item) => {
              const active = item.key === activeKey;
              return (
                <Link
                  key={item.key}
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

        <div className="border-line-soft bg-surface mt-auto flex items-center gap-2.5 rounded-xl border p-2.5 max-md:hidden">
          <span className="bg-sage-soft text-sage-deep grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
            {initials(user.name)}
          </span>
          <span className="leading-tight">
            <span className="block text-[13.5px] font-bold">{user.name}</span>
            {user.role && <span className="text-ink-faint block text-[11.5px]">{user.role}</span>}
          </span>
        </div>
      </nav>

      <main className="min-w-0 overflow-x-hidden p-6 md:p-8">{children}</main>
    </div>
  );
}
