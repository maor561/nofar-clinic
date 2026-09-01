"use server";

import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import { createSeriesTemplate, updateSeriesTemplate } from "@/modules/patients";

export type SeriesState = { error?: string; ok?: number };

const PATH = "/t/settings/series";

export async function addSeriesAction(_prev: SeriesState, fd: FormData): Promise<SeriesState> {
  const name = String(fd.get("name") ?? "");
  const sessionCount = Number(fd.get("sessionCount") ?? 0);
  const tt = String(fd.get("treatmentType") ?? "none");
  const tdb = await getTherapistDb();
  try {
    await createSeriesTemplate(tdb, {
      name,
      sessionCount,
      treatmentType: tt && tt !== "none" ? tt : null,
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    return {
      error:
        m === "duplicate"
          ? "כבר קיימת סדרה בשם הזה"
          : m === "invalid_count"
            ? "מספר מפגשים לא תקין (1–100)"
            : "שם לא תקין",
    };
  }
  revalidatePath(PATH);
  return { ok: Date.now() };
}

export async function updateSeriesAction(id: string, fd: FormData): Promise<void> {
  const name = String(fd.get("name") ?? "");
  const sessionCount = Number(fd.get("sessionCount") ?? 0);
  const tdb = await getTherapistDb();
  try {
    await updateSeriesTemplate(tdb, id, { name, sessionCount });
  } catch {
    return;
  }
  revalidatePath(PATH);
}

export async function toggleSeriesAction(id: string, active: boolean): Promise<void> {
  const tdb = await getTherapistDb();
  await updateSeriesTemplate(tdb, id, { active });
  revalidatePath(PATH);
}
