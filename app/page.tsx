import Link from "next/link";
import { Button, Logo } from "@/modules/core/design-system";
import { strings } from "@/lib/strings";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-6 px-6 py-16">
      <Logo subtitle={strings.scaffold_tagline} />
      <p className="text-ink-soft text-sm">{strings.scaffold_ready_body}</p>
      <Button asChild size="lg">
        <Link href="/design">מערכת העיצוב (WP-01)</Link>
      </Button>
    </main>
  );
}
