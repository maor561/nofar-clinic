import { Logo } from "../logo";
import { TopNav, type NavItem } from "./shell-nav";

export type { NavItem as PatientNavItem } from "./shell-nav";

const DEFAULT_NAV: NavItem[] = [
  { label: "דשבורד", icon: "grid", href: "/p" },
  { label: "התוכנית שלי", icon: "plan", href: "/p/plan" },
  { label: "המשימות שלי", icon: "task-done", href: "/p/tasks" },
  { label: "הפגישות שלי", icon: "calendar", href: "/p/appointments" },
  { label: "הודעות", icon: "chat", href: "/p/messages" },
  { label: "מסמכים", icon: "doc", href: "/p/documents" },
  { label: "שאלון קליטה", icon: "form", href: "/p/questionnaire" },
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
  user: { name: string };
  nav?: NavItem[];
  headerSlot?: React.ReactNode;
  children: React.ReactNode;
};

export function PatientShell({ user, nav = DEFAULT_NAV, headerSlot, children }: Props) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-line bg-surface flex flex-wrap items-center gap-x-5 gap-y-2 border-b px-6 py-3.5">
        <Logo />
        <TopNav items={nav} />
        <div className="ms-auto flex items-center gap-2.5">
          <span className="text-[13px] font-semibold">{user.name}</span>
          <span className="bg-sage-soft text-sage-deep grid size-8 place-items-center rounded-full text-xs font-bold">
            {initials(user.name)}
          </span>
          {headerSlot}
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-7">{children}</main>
    </div>
  );
}
