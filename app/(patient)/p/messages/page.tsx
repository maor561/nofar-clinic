import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/features";
import { getPatientDb } from "@/modules/core/authz/server";
import { listMessages, markThreadRead } from "@/modules/messaging";
import { MessageList } from "@/app/(therapist)/t/messages/message-list";
import { ChatComposer, ChatPoller } from "@/app/(therapist)/t/messages/chat";
import { sendMessageAction } from "@/app/(therapist)/t/messages/actions";

export const metadata: Metadata = { title: "הודעות" };

export default async function MyMessagesPage() {
  if (!FEATURES.messaging) notFound();

  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return null;

  await markThreadRead(pdb, me.id);
  const messages = await listMessages(pdb, me.id);

  return (
    <div className="flex h-[calc(100svh-9rem)] flex-col">
      <header className="border-line border-b pb-3">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">הודעות עם נופר</h1>
        <p className="text-ink-soft text-[12px]">כל שאלה או עדכון — כאן.</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList messages={messages} mine="patient" />
      </div>

      <ChatComposer action={sendMessageAction.bind(null, me.id)} />
      <ChatPoller />
    </div>
  );
}
