"use server";

import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatientUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { setTherapistNote } from "@/modules/food-log";

export type NoteState = { ok?: number; error?: string };

export async function saveFoodNoteAction(
  patientId: string,
  date: string,
  _prev: NoteState,
  fd: FormData,
): Promise<NoteState> {
  const note = String(fd.get("therapistNote") ?? "");
  const tdb = await getTherapistDb();
  try {
    await setTherapistNote(tdb, patientId, date, note);
  } catch {
    return { error: "שמירת ההערה נכשלה. נסו שוב." };
  }

  if (note.trim()) {
    const uid = await getPatientUserId(patientId);
    if (uid) {
      await notify({
        recipientUserId: uid,
        therapistId: tdb.therapistId,
        type: "generic",
        titleHe: "נופר הגיבה ליומן האכילה שלך",
        bodyHe: `הערה חדשה ליום ${date}.`,
        link: `/p/food?d=${date}`,
        email: true,
      });
    }
  }

  revalidatePath(`/t/patients/${patientId}/food`);
  revalidatePath("/p/food");
  return { ok: Date.now() };
}
