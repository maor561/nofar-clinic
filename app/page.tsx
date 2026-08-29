import { strings } from "@/lib/strings";

/**
 * WP-00 scaffold check page — proves RTL, the Calm Wellness tokens and both fonts
 * render. Replaced by the real therapist/patient shells in WP-01+.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16">
      <header className="flex items-center gap-3">
        <span
          className="bg-sage-soft text-sage-deep grid h-10 w-10 place-items-center rounded-[11px]"
          aria-hidden
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 4S7.8 4.2 5.3 11.6C3.9 15.8 6.7 19 10.6 18.6 18 17.2 20 4 20 4Z" />
            <path d="M13.2 10 7.6 16" />
          </svg>
        </span>
        <div>
          <h1 className="text-ink font-[family-name:var(--font-display)] text-2xl font-bold">
            נופר
          </h1>
          <p className="text-ink-soft text-sm">{strings.scaffold_tagline}</p>
        </div>
      </header>

      <section className="border-line bg-surface rounded-[var(--radius-card)] border p-6 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 font-[family-name:var(--font-display)] text-lg font-semibold">
          {strings.scaffold_ready_title}
        </h2>
        <p className="text-ink-soft text-sm">{strings.scaffold_ready_body}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {(
            [
              ["sage-deep", "bg-sage-deep"],
              ["sage", "bg-sage"],
              ["sage-soft", "bg-sage-soft"],
              ["blush", "bg-blush"],
              ["amber-soft", "bg-amber-soft"],
              ["ground", "bg-ground border border-line"],
            ] as const
          ).map(([name, cls]) => (
            <span key={name} className="text-ink-soft flex items-center gap-2 text-xs">
              <span className={`h-5 w-5 rounded-full ${cls}`} />
              {name}
            </span>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button className="bg-sage-deep rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#45604f]">
            {strings.action_primary_example}
          </button>
          <button className="border-line bg-surface text-ink hover:bg-surface-2 rounded-[var(--radius-control)] border px-4 py-2 text-sm font-semibold transition-colors">
            {strings.action_secondary_example}
          </button>
        </div>
      </section>
    </main>
  );
}
