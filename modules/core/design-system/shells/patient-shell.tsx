import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "../icon";
import { Logo } from "../logo";

export type PatientNavItem = {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  badge?: number;
};

const DEFAULT_NAV: PatientNavItem[] = [
  { key: "dashboard", label: "דשבורד", icon: "grid", href: "/p" },
  { key: "plan", label: "התוכנית שלי", icon: "plan", href: "/p/plan" },
  { key: "tasks", label: "המשימות שלי", icon: "task-done", href: "/p/tasks" },
  { key: "appointments", label: "הפגישות שלי", icon: "calendar", href: "/p/appointments" },
  { key: "messages", label: "הודעות", icon: "chat", href: "/p/messages" },
  { key: "documents", label: "מסמכים", icon: "doc", href: "/p/documents" },
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
  user: { name: string };
  nav?: PatientNavItem[];
  children: React.ReactNode;
};

export function PatientShell({ activeKey, user, nav = DEFAULT_NAV, children }: Props) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-line bg-surface flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-6 py-3.5">
        <Logo />
        <nav aria-label="ניווט" className="flex flex-wrap gap-0.5">
          {nav.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
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
        <div className="ms-auto flex items-center gap-2.5">
          <span className="text-[13px] font-semibold">{user.name}</span>
          <span className="bg-sage-soft text-sage-deep grid size-8 place-items-center rounded-full text-xs font-bold">
            {initials(user.name)}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-7">{children}</main>
    </div>
  );
}
