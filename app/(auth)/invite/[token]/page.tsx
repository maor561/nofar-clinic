import type { Metadata } from "next";
import Link from "next/link";
import { peekInvite } from "@/modules/core/auth";
import { DbNotConfiguredError } from "@/modules/core/authz";
import { Button } from "@/modules/core/design-system";
import { InviteForm } from "./invite-form";

export const metadata: Metadata = { title: "הזמנה — נופר" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let preview: Awaited<ReturnType<typeof peekInvite>> | null = null;
  try {
    preview = await peekInvite(token);
  } catch (e) {
    if (!(e instanceof DbNotConfiguredError)) throw e;
  }

  if (!preview) {
    return (
      <div className="space-y-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          הקישור אינו תקף
        </h1>
        <p className="text-ink-soft text-sm">
          ההזמנה פגה, כבר נעשה בה שימוש, או שהקישור שגוי. בקשי מנופר לשלוח הזמנה חדשה.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">למסך ההתחברות</Link>
        </Button>
      </div>
    );
  }

  return <InviteForm token={token} email={preview.email} />;
}
