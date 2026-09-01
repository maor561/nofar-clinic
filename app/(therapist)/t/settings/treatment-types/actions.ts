"use server";

import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import {
  createTreatmentType,
  renameTreatmentType,
  setTreatmentTypeActive,
} from "@/modules/patients";

export type TTState = { error?: string; ok?: number };

const PATH = "/t/settings/treatment-types";

export async function addTypeAction(_prev: TTState, fd: FormData): Promise<TTState> {
  const name = String(fd.get("name") ?? "");
  const tdb = await getTherapistDb();
  try {
    await createTreatmentType(tdb, name);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    return { error: m === "duplicate" ? "סוג טיפול בשם הזה כבר קיים" : "שם לא תקין (עד 60 תווים)" };
  }
  revalidatePath(PATH);
  return { ok: Date.now() };
}

export async function renameTypeAction(id: string, fd: FormData): Promise<void> {
  const name = String(fd.get("name") ?? "");
  const tdb = await getTherapistDb();
  try {
    await renameTreatmentType(tdb, id, name);
  } catch {
    return;
  }
  revalidatePath(PATH);
  revalidatePath("/t/patients");
}

export async function toggleTypeAction(id: string, active: boolean): Promise<void> {
  const tdb = await getTherapistDb();
  await setTreatmentTypeActive(tdb, id, active);
  revalidatePath(PATH);
}
