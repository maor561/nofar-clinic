"use server";

import { revalidatePath } from "next/cache";
import { FEATURES } from "@/lib/features";
import { getScopedDb } from "@/modules/core/authz/server";
import { getPatientUserId, getTherapistUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { sendMessage } from "@/modules/messaging";
import type { ChatFormState } from "./chat";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Send a message in a patient's thread — works for either role via getScopedDb(). */
export async function sendMessageAction(
  patientId: string,
  _prev: ChatFormState,
  fd: FormData,
): Promise<ChatFormState> {
  if (!FEATURES.messaging) return { error: "התכונה אינה זמינה כרגע." };
  if (!UUID_RE.test(patientId)) return { error: "שיחה לא תקינה" };
  const body = String(fd.get("body") ?? "");
  if (!body.trim()) return { error: "לא ניתן לשלוח הודעה ריקה" };

  const db = await getScopedDb();
  if (!db) return { error: "יש להתחבר מחדש" };

  let sender: "therapist" | "patient";
  try {
    ({ sender } = await sendMessage(db, patientId, body));
  } catch {
    return { error: "שליחת ההודעה נכשלה." };
  }

  // notify the other side
  const snippet = body.trim().slice(0, 120);
  if (sender === "therapist") {
    const uid = await getPatientUserId(patientId);
    if (uid)
      await notify({
        recipientUserId: uid,
        therapistId: db.therapistId,
        type: "message_received",
        titleHe: "הודעה חדשה מנופר",
        bodyHe: snippet,
        link: "/p/messages",
      });
  } else {
    const uid = await getTherapistUserId(db.therapistId);
    if (uid)
      await notify({
        recipientUserId: uid,
        therapistId: db.therapistId,
        type: "message_received",
        titleHe: "הודעה חדשה ממטופל/ת",
        bodyHe: snippet,
        link: `/t/messages/${patientId}`,
      });
  }

  revalidatePath(`/t/messages/${patientId}`);
  revalidatePath("/t/messages");
  revalidatePath("/p/messages");
  return { ok: Date.now() };
}
