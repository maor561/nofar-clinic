"use server";

import { revalidatePath } from "next/cache";
import { markMineRead } from "@/modules/core/notifications/server";

export async function markAllReadAction() {
  await markMineRead();
  revalidatePath("/t/alerts");
}
