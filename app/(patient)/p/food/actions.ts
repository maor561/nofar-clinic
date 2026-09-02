"use server";

import { revalidatePath } from "next/cache";
import { getPatientDb } from "@/modules/core/authz/server";
import { getTherapistUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { saveFoodDay, MEALS } from "@/modules/food-log";

export type FoodState = { error?: string; ok?: number };

export async function saveFoodDayAction(
  date: string,
  _prev: FoodState,
  fd: FormData,
): Promise<FoodState> {
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" ? v : "";
  };

  const meals = Object.fromEntries(MEALS.map((m) => [m, str(m)])) as Record<string, string>;

  const pdb = await getPatientDb();
  let firstEntry = false;
  try {
    ({ firstEntry } = await saveFoodDay(pdb, date, {
      ...meals,
      patientNote: str("patientNote"),
    }));
  } catch {
    return { error: "השמירה נכשלה. נסו שוב." };
  }

  if (firstEntry) {
    const me = await pdb.self();
    const uid = await getTherapistUserId(pdb.therapistId);
    if (uid && me) {
      await notify({
        recipientUserId: uid,
        therapistId: pdb.therapistId,
        type: "generic",
        titleHe: "יומן אכילה עודכן",
        bodyHe: `${me.firstName} ${me.lastName} מילא/ה את יומן האכילה ל-${date}.`,
        link: `/t/patients/${pdb.patientId}/food?d=${date}`,
      });
    }
  }

  revalidatePath("/p/food");
  revalidatePath(`/t/patients/${pdb.patientId}/food`);
  return { ok: Date.now() };
}
