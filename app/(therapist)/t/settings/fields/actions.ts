"use server";

import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import {
  listManagedFieldDefs,
  createManagedFieldDef,
  updateManagedFieldDef,
  FieldDefError,
  type NewFieldInput,
  type UiFieldType,
} from "@/modules/core/fields";

/** WP-60 — the settings screen only manages the "treatment_session" entity. */
const ENTITY = "treatment_session" as const;
const PATH = "/t/settings/fields";

export type FieldState = { error?: string; ok?: number };

const ERR: Record<string, string> = {
  invalid_label: "שם המדד קצר מדי",
  duplicate_label: "כבר קיים מדד בשם הזה",
  invalid_range: "טווח לא תקין — הערך המרבי חייב להיות גדול מהמזערי",
  need_options: "צריך לפחות שתי אפשרויות בחירה",
  dup_options: "יש אפשרויות בחירה כפולות",
};

function num(fd: FormData, k: string): number | null {
  const raw = String(fd.get(k) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function addFieldAction(_prev: FieldState, fd: FormData): Promise<FieldState> {
  const type = String(fd.get("type") ?? "") as UiFieldType;
  const input: NewFieldInput = {
    labelHe: String(fd.get("labelHe") ?? ""),
    type,
    unit: String(fd.get("unit") ?? "").trim() || null,
    min: num(fd, "min"),
    max: num(fd, "max"),
    integer: fd.get("integer") === "on",
    maxLength: num(fd, "maxLength"),
    required: fd.get("required") === "on",
    options: String(fd.get("options") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  const tdb = await getTherapistDb();
  try {
    await createManagedFieldDef(tdb.therapistId, ENTITY, input);
  } catch (e) {
    if (e instanceof FieldDefError) return { error: ERR[e.message] ?? "הגדרת המדד לא תקינה" };
    return { error: "הגדרת המדד לא תקינה" };
  }
  revalidatePath(PATH);
  return { ok: Date.now() };
}

export async function renameFieldAction(id: string, fd: FormData): Promise<void> {
  const tdb = await getTherapistDb();
  try {
    await updateManagedFieldDef(tdb.therapistId, id, { labelHe: String(fd.get("labelHe") ?? "") });
  } catch {
    return;
  }
  revalidatePath(PATH);
}

export async function toggleFieldAction(id: string, active: boolean): Promise<void> {
  const tdb = await getTherapistDb();
  await updateManagedFieldDef(tdb.therapistId, id, { active });
  revalidatePath(PATH);
}

/** Swap `order` with the previous / next sibling. */
export async function moveFieldAction(id: string, dir: "up" | "down"): Promise<void> {
  const tdb = await getTherapistDb();
  const defs = await listManagedFieldDefs(tdb.therapistId, ENTITY, { includeInactive: true });
  const i = defs.findIndex((d) => d.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= defs.length) return;
  await updateManagedFieldDef(tdb.therapistId, defs[i].id, { order: defs[j].order });
  await updateManagedFieldDef(tdb.therapistId, defs[j].id, { order: defs[i].order });
  revalidatePath(PATH);
}
