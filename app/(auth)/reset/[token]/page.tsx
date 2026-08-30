import type { Metadata } from "next";
import Link from "next/link";
import { peekReset } from "@/modules/core/auth";
import { DbNotConfiguredError } from "@/modules/core/authz";
import { Button } from "@/modules/core/design-system";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "איפוס סיסמה — נופר" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let valid = false;
  try {
    valid = await peekReset(token);
  } catch (e) {
    if (!(e instanceof DbNotConfiguredError)) throw e;
  }

  if (!valid) {
    return (
      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          הקישור אינו תקף
        </h1>
        <p className="text-ink-soft text-sm">קישור האיפוס פג תוקף או שכבר נעשה בו שימוש.</p>
        <Button asChild variant="outline">
          <Link href="/forgot">בקשת קישור חדש</Link>
        </Button>
      </div>
    );
  }

  return <ResetForm token={token} />;
}
