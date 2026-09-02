import Link from "next/link";
import { FEATURES } from "@/lib/features";
import { BRAND_BY } from "@/lib/brand";
import { Logo } from "../logo";
import { TopNav, type NavItem } from "./shell-nav";
import { PatientMobileNav } from "./patient-mobile-nav";
import { PatientOnboarding } from "./patient-onboarding";

export type { NavItem as PatientNavItem } from "./shell-nav";

const DEFAULT_NAV: NavItem[] = [
  { label: "דשבורד", icon: "grid", href: "/p" },
  { label: "התוכנית שלי", icon: "plan", href: "/p/plan" },
  { label: "המשימות שלי", icon: "task-done", href: "/p/tasks" },
  { label: "המפגשים שלי", icon: "leaf", href: "/p/sessions" },
  { label: "הפגישות שלי", icon: "calendar", href: "/p/appointments" },
  { label: "יומן אכילה", icon: "apple", href: "/p/food" },
  ...(FEATURES.messaging
    ? [{ label: "הודעות", icon: "chat", href: "/p/messages" } as NavItem]
    : []),
  { label: "מסמכים", icon: "doc", href: "/p/documents" },
  { label: "השאלונים שלי", icon: "form", href: "/p/questionnaire" },
  { label: "פרופיל", icon: "settings", href: "/p/profile" },
];

/** short labels for the phone bottom bar */
const MOBILE_LABELS: Record<string, string> = {
  "/p": "בית",
  "/p/food": "אוכל",
  "/p/tasks": "משימות",
  "/p/appointments": "פגישות",
};

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
  /** desktop header actions (bell + logout) */
  headerSlot?: React.ReactNode;
  /** phone top-bar actions — bell only; logout lives in the "עוד" sheet */
  mobileHeaderSlot?: React.ReactNode;
  pushSlot?: React.ReactNode;
  logoutSlot?: React.ReactNode;
  children: React.ReactNode;
};

export function PatientShell({
  user,
  nav = DEFAULT_NAV,
  headerSlot,
  mobileHeaderSlot,
  pushSlot,
  logoutSlot,
  children,
}: Props) {
  const mobileNav = nav.map((i) => ({ ...i, label: MOBILE_LABELS[i.href] ?? i.label }));

  return (
    <div className="flex min-h-svh flex-col">
      {/* desktop — horizontal nav */}
      <header className="border-line bg-surface hidden flex-wrap items-center gap-x-5 gap-y-2 border-b px-6 py-3.5 md:flex">
        <Link href="/p" aria-label="למסך הראשי">
          <Logo subtitle={BRAND_BY} />
        </Link>
        <TopNav items={nav} />
        <div className="ms-auto flex items-center gap-2.5">
          <span className="text-[13px] font-semibold">{user.name}</span>
          <span className="bg-sage-soft text-sage-deep grid size-8 place-items-center rounded-full text-xs font-bold">
            {initials(user.name)}
          </span>
          {headerSlot}
        </div>
      </header>

      {/* phone — slim sticky top bar */}
      <header className="border-line bg-surface sticky top-0 z-30 flex items-center justify-between border-b px-4 py-2 md:hidden">
        <Link href="/p" aria-label="למסך הראשי">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">{mobileHeaderSlot}</div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-7 max-md:px-4 max-md:pt-4 max-md:pb-24">
        {children}
      </main>

      <PatientMobileNav items={mobileNav} pushSlot={pushSlot} logoutSlot={logoutSlot} />
      <PatientOnboarding />
    </div>
  );
}
