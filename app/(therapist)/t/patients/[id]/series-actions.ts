"use server";

import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import { assignPatientSeries, cancelPatientSeries } from "@/modules/patients";

export async function assignSeriesAction(patientId: string, fd: FormData): Promise<void> {
  const templateId = String(fd.get("templateId") ?? "");
  if (!templateId) return;
  const tdb = await getTherapistDb();
  try {
    await assignPatientSeries(tdb, patientId, templateId);
  } catch {
    /* one active series at a time; ignore */
  }
  revalidatePath(`/t/patients/${patientId}`);
  revalidatePath("/p");
}

export async function cancelSeriesAction(patientId: string, seriesId: string): Promise<void> {
  const tdb = await getTherapistDb();
  await cancelPatientSeries(tdb, seriesId);
  revalidatePath(`/t/patients/${patientId}`);
  revalidatePath("/p");
}
