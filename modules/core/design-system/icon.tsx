import { cn } from "@/lib/utils";

/**
 * Calm Wellness icon set — a small, hand-tuned stroke set shared by both shells.
 * Stroke 1.6, round caps, 24-box. Prefer these over ad-hoc lucide icons in
 * product surfaces so the visual language stays consistent (docs/DESIGN_SYSTEM.md §5).
 */
const PATHS = {
  grid: "M3.5 3.5h7.5v7.5H3.5zM13 3.5h7.5v7.5H13zM3.5 13h7.5v7.5H3.5zM13 13h7.5v7.5H13z",
  users:
    "M9 4.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6M3.6 19c.8-3 3-4.6 5.4-4.6S13.6 16 14.4 19M16 5.3a3 3 0 0 1 0 5.4M17.6 14.8c2 .6 3.3 2 3.9 4.2",
  calendar: "M3.5 5h17v15.5h-17zM3.5 9.7h17M8 3.3v3.4M16 3.3v3.4",
  clock: "M12 4.4a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2M12 7.6v4.7l3.2 2",
  chat: "M20.5 12a7.7 7.7 0 0 1-11.2 6.9L4 20.4l1.5-4.2A7.7 7.7 0 1 1 20.5 12Z",
  bell: "M18 9a6 6 0 1 0-12 0c0 5-2.1 6.6-2.1 6.6h16.2S18 14 18 9ZM10 19a2 2 0 0 0 4 0",
  doc: "M13 3.5H7.2A2.2 2.2 0 0 0 5 5.7v12.6A2.2 2.2 0 0 0 7.2 20.5h9.6A2.2 2.2 0 0 0 19 18.3V9.5L13 3.5ZM13 3.5V9.5h6",
  settings:
    "M12 8.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4M12 3.6v2.3M12 18.1v2.3M20.4 12h-2.3M5.9 12H3.6M17.7 6.3l-1.6 1.6M7.9 16.1l-1.6 1.6M17.7 17.7l-1.6-1.6M7.9 7.9 6.3 6.3",
  search: "M11 4.6a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8M20 20l-4.4-4.4",
  plus: "M12 5.2v13.6M5.2 12h13.6",
  leaf: "M20 4S7.8 4.2 5.3 11.6C3.9 15.8 6.7 19 10.6 18.6 18 17.2 20 4 20 4ZM13.2 10 7.6 16",
  check: "m5 12.5 4.5 4.5L19 7",
  lock: "M5 10.5h14v10H5zM8 10.5V8a4 4 0 0 1 8 0v2.5",
  x: "m6 6 12 12M18 6 6 18",
  chart: "M4 19V5M4 19h16M8 15l3-3 3 2 5-6",
  chevron: "m14.5 6-6 6 6 6",
  plan: "M6 4.6h12v15.8H6zM9 4.6a3 3 0 0 1 6 0M9.6 11h4.8M9.6 15h4.8",
  task: "M4.6 4.6h14.8v14.8H4.6z",
  "task-done": "M4.6 4.6h14.8v14.8H4.6zM8.6 12l2.4 2.4 4.4-4.9",
  form: "M4.6 3.5h14.8v17H4.6zM8 8h8M8 12h8M8 16h5",
  status: "M4 8.5h11l-3-3M20 15.5H9l3 3",
  phone:
    "M6.6 4.6c1 0 1.8.7 2 1.6l.6 2.5a2 2 0 0 1-.6 1.9L7.4 11.7a12 12 0 0 0 4.9 4.9l1.1-1.2a2 2 0 0 1 1.9-.6l2.5.6c.9.2 1.6 1 1.6 2v2.2c0 1.2-1 2.1-2.2 2A16 16 0 0 1 4.6 6.8 2 2 0 0 1 6.6 4.6Z",
  mail: "M3.5 5h17v14h-17zM4.2 7l7.8 5.8L19.8 7",
  info: "M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8M12 11v5.5M12 7.7v.2",
  target: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16M12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8",
  apple:
    "M12 8c-1.6-2.5-6.5-2.4-6.5 3.2 0 4.4 3.4 8.3 5.2 8.3.9 0 1-.6 1.3-.6s.5.6 1.3.6c1.8 0 5.2-3.9 5.2-8.3 0-5.6-4.9-5.7-6.5-3.2M12 8c0-1.8 1-3.4 2.7-3.8",
  pill: "M9 15l6-6M5.7 9.8a3.5 3.5 0 0 1 5-5l3.5 3.5a3.5 3.5 0 0 1-5 5z",
  run: "M15 3.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4M13.5 9 10 11l2.5 2.5.5 5M12.5 13.5 9 19M13 11.5l3.5 1.5 2.5-2M6 12l3-1",
  shield: "M12 3.5 5 6v5.5c0 4.6 3 7.7 7 9 4-1.3 7-4.4 7-9V6L12 3.5ZM9 12l2 2 4-4.5",
  menu: "M4 7h16M4 12h16M4 17h16",
} as const;

export type IconName = keyof typeof PATHS;

type IconProps = React.SVGProps<SVGSVGElement> & {
  name: IconName;
  /** pixel size, default 20 */
  size?: number;
};

export function Icon({ name, size = 20, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={props["aria-label"] ? undefined : true}
      className={cn("shrink-0", className)}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
