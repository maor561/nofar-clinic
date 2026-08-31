import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/modules/core/auth/server";
import { Button, Logo } from "@/modules/core/design-system";
import { buildInfo } from "@/lib/build-info";

/**
 * Front door. A signed-in user goes straight to their space; everyone else gets
 * a minimal branded landing with a single way in.
 */
export default async function Home() {
  const session = await getCurrentSession().catch(() => null);
  if (session?.role === "therapist") redirect("/t");
  if (session?.role === "patient") redirect("/p");

  const built = buildInfo.builtAt
    ? new Date(buildInfo.builtAt).toLocaleString("he-IL", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-1 flex-col items-center justify-center gap-7 px-6 py-16 text-center">
      <Logo subtitle="ניהול הקשר הטיפולי" />

      <div className="space-y-1.5">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          המרחב של נופר כהן
        </h1>
        <p className="text-ink-soft text-sm">
          נטורופתיה · רפלקסולוגיה · תזונה. הכניסה למטפלת ולמטופלים.
        </p>
      </div>

      <Button asChild size="lg">
        <Link href="/login">כניסה</Link>
      </Button>

      <p className="text-ink-faint mt-6 text-[11px] tabular-nums" dir="ltr">
        build {buildInfo.shortSha} · {buildInfo.ref} · {built} ·{" "}
        <Link href="/api/version" className="underline">
          /api/version
        </Link>
      </p>
    </main>
  );
}
