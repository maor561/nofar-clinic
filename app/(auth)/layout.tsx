import { Icon } from "@/modules/core/design-system";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
      <aside className="from-sage-deep flex flex-col bg-gradient-to-b to-[#3c5646] p-10 text-white md:p-11">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/15">
          <Icon name="leaf" size={22} />
        </span>
        <h2 className="mt-auto font-[family-name:var(--font-display)] text-3xl leading-snug font-bold">
          המרחב הטיפולי שלך,
          <br />
          במקום אחד.
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/80">
          תוכנית הטיפול, הפגישות, המשימות וההודעות עם נופר — מרוכזים ונגישים בכל זמן.
        </p>
        <p className="mt-7 text-xs text-white/60">נופר כהן · נטורופתיה · רפלקסולוגיה · תזונה</p>
      </aside>

      <main className="flex items-center justify-center p-8 md:p-11">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
