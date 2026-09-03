import { BRAND, BRAND_SLOGAN } from "@/lib/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh grid-cols-1 md:grid-cols-[0.9fr_1.1fr]">
      <aside className="from-sage-deep flex flex-col bg-gradient-to-b to-[#3c5646] p-10 text-white md:p-11">
        <span className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden
            className="size-11 rounded-2xl object-cover"
          />
          <span className="font-[family-name:var(--font-display)] text-xl font-bold">{BRAND}</span>
        </span>
        <h2 className="mt-auto font-[family-name:var(--font-display)] text-3xl leading-snug font-bold">
          {BRAND_SLOGAN}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-white/80">
          תוכנית הטיפול, הפגישות והמשימות עם נופר — מרוכזים ונגישים בכל זמן.
        </p>
        <p className="mt-7 text-xs text-white/60">נופר כהן נטורופתית N.D והרבליסטית קלינית Cl.H</p>
      </aside>

      <main className="flex items-center justify-center p-8 md:p-11">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
