import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getPatient } from "@/modules/patients";
import { listMessages, markThreadRead } from "@/modules/messaging";
import { Icon } from "@/modules/core/design-system";
import { MessageList } from "../message-list";
import { ChatComposer, ChatPoller } from "../chat";
import { sendMessageAction } from "../actions";

export const metadata: Metadata = { title: "שיחה" };

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  if (!FEATURES.messaging) notFound();

  const { patientId } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, patientId);
  if (!p) notFound();

  await markThreadRead(tdb, patientId);
  const messages = await listMessages(tdb, patientId);
  await audit("view", "message_thread", { patientId, entityId: patientId });

  return (
    <div className="flex h-[calc(100svh-6rem)] flex-col">
      <header className="border-line flex items-center gap-3 border-b pb-3">
        <Link href="/t/messages" className="text-ink-faint hover:text-ink" aria-label="חזרה">
          <Icon name="chevron" size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-[family-name:var(--font-display)] text-lg font-bold">
            {p.firstName} {p.lastName}
          </h1>
          <Link
            href={`/t/patients/${patientId}`}
            className="text-sage-deep text-[12px] hover:underline"
          >
            לתיק המטופל/ת
          </Link>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList messages={messages} mine="therapist" />
      </div>

      <ChatComposer action={sendMessageAction.bind(null, patientId)} />
      <ChatPoller />
    </div>
  );
}
