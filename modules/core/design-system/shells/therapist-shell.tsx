import { FEATURES } from "@/lib/features";
import { Logo } from "../logo";
import { RailNav, type NavGroup, type NavItem } from "./shell-nav";

export type { NavItem, NavGroup } from "./shell-nav";

const MANAGE_ITEMS: NavItem[] = [
  { label: "דשבורד", icon: "grid", href: "/t" },
  { label: "מטופלים", icon: "users", href: "/t/patients" },
  { label: "יומן", icon: "calendar", href: "/t/calendar" },
  ...(FEATURES.messaging
    ? [{ label: "הודעות", icon: "chat", href: "/t/messages" } as NavItem]
    : []),
];

const DEFAULT_GROUPS: NavGroup[] = [
  {
    label: "ניהול",
    items: MANAGE_ITEMS,
  },
  {
    label: "כללי",
    items: [
      { label: "מסמכים", icon: "doc", href: "/t/documents" },
      { label: "התראות", icon: "bell", href: "/t/alerts" },
      { label: "יומן פעילות", icon: "status", href: "/t/audit" },
      { label: "הגדרות", icon: "settings", href: "/t/settings" },
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
  user: { name: string; role?: string };
  groups?: NavGroup[];
  headerSlot?: React.ReactNode;
  children: React.ReactNode;
};

export function TherapistShell({ user, groups = DEFAULT_GROUPS, headerSlot, children }: Props) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[236px_1fr]">
      <nav
        aria-label="ניווט ראשי"
        className="border-line-soft bg-surface-2 flex flex-col gap-1 border-s p-3.5 max-md:flex-row max-md:flex-wrap max-md:items-center max-md:border-s-0 max-md:border-b"
      >
        <div className="flex items-center justify-between gap-2 px-2 pt-1.5 pb-3.5 max-md:flex-1">
          <Logo subtitle="ניהול קליניקה" />
          {/* actions stay reachable on mobile (rail collapses to a top bar) */}
          <div className="md:hidden">{headerSlot}</div>
        </div>

        <RailNav groups={groups} />

        <div className="border-line-soft bg-surface mt-auto flex items-center gap-2.5 rounded-xl border p-2.5 max-md:hidden">
          <span className="bg-sage-soft text-sage-deep grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold">
            {initials(user.name)}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13.5px] font-bold">{user.name}</span>
            {user.role && (
              <span className="text-ink-faint block truncate text-[11.5px]">{user.role}</span>
            )}
          </span>
          {headerSlot}
        </div>
      </nav>

      <main className="min-w-0 overflow-x-hidden p-6 md:p-8">{children}</main>
    </div>
  );
}
