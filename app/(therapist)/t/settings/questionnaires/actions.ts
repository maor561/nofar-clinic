"use server";

import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import { createTemplate, updateTemplate } from "@/modules/questionnaires";
import {
  createManagedFieldDef,
  updateManagedFieldDef,
  listManagedFieldDefs,
  FieldDefError,
  type NewFieldInput,
  type UiFieldType,
} from "@/modules/core/fields";

const ENTITY = "questionnaire" as const;
const LIST = "/t/settings/questionnaires";

export type TplState = { error?: string; ok?: number };

const ERR: Record<string, string> = {
  invalid_name: "שם קצר מדי",
  duplicate: "כבר קיים שאלון בשם הזה",
  invalid_label: "שם השאלה קצר מדי",
  duplicate_label: "כבר קיימת שאלה בשם הזה",
  invalid_range: "טווח לא תקין",
  need_options: "צריך לפחות שתי אפשרויות",
  dup_options: "יש אפשרויות כפולות",
};

function num(fd: FormData, k: string): number | null {
  const raw = String(fd.get(k) ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/* --- templates --- */

export async function addTemplateAction(_prev: TplState, fd: FormData): Promise<TplState> {
  const tdb = await getTherapistDb();
  try {
    await createTemplate(tdb, {
      name: String(fd.get("name") ?? ""),
      descriptionHe: String(fd.get("descriptionHe") ?? ""),
    });
  } catch (e) {
    return { error: ERR[(e as Error).message] ?? "יצירת השאלון נכשלה" };
  }
  revalidatePath(LIST);
  return { ok: Date.now() };
}

export async function renameTemplateAction(id: string, fd: FormData): Promise<void> {
  const tdb = await getTherapistDb();
  try {
    await updateTemplate(tdb, id, { name: String(fd.get("name") ?? "") });
  } catch {
    return;
  }
  revalidatePath(LIST);
}

export async function toggleTemplateAction(id: string, active: boolean): Promise<void> {
  const tdb = await getTherapistDb();
  await updateTemplate(tdb, id, { active });
  revalidatePath(LIST);
}

export async function updateTemplateIntroAction(id: string, fd: FormData): Promise<void> {
  const tdb = await getTherapistDb();
  try {
    await updateTemplate(tdb, id, { descriptionHe: String(fd.get("descriptionHe") ?? "") });
  } catch {
    return;
  }
  revalidatePath(`${LIST}/${id}`);
}

/* --- questions inside one template --- */

export async function addQuestionAction(
  templateId: string,
  _prev: TplState,
  fd: FormData,
): Promise<TplState> {
  const type = String(fd.get("type") ?? "") as UiFieldType;
  const input: NewFieldInput = {
    labelHe: String(fd.get("labelHe") ?? ""),
    type,
    min: num(fd, "min"),
    max: num(fd, "max"),
    maxLength: num(fd, "maxLength"),
    required: fd.get("required") === "on",
    options: String(fd.get("options") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  const tdb = await getTherapistDb();
  try {
    await createManagedFieldDef(tdb.therapistId, ENTITY, input, templateId);
  } catch (e) {
    if (e instanceof FieldDefError) return { error: ERR[e.message] ?? "הגדרת השאלה לא תקינה" };
    return { error: "הגדרת השאלה לא תקינה" };
  }
  revalidatePath(`${LIST}/${templateId}`);
  return { ok: Date.now() };
}

export async function renameQuestionAction(
  templateId: string,
  id: string,
  fd: FormData,
): Promise<void> {
  const tdb = await getTherapistDb();
  try {
    await updateManagedFieldDef(tdb.therapistId, id, { labelHe: String(fd.get("labelHe") ?? "") });
  } catch {
    return;
  }
  revalidatePath(`${LIST}/${templateId}`);
}

export async function toggleQuestionAction(
  templateId: string,
  id: string,
  active: boolean,
): Promise<void> {
  const tdb = await getTherapistDb();
  await updateManagedFieldDef(tdb.therapistId, id, { active });
  revalidatePath(`${LIST}/${templateId}`);
}

export async function moveQuestionAction(
  templateId: string,
  id: string,
  dir: "up" | "down",
): Promise<void> {
  const tdb = await getTherapistDb();
  const defs = await listManagedFieldDefs(tdb.therapistId, ENTITY, {
    includeInactive: true,
    templateId,
  });
  const i = defs.findIndex((d) => d.id === id);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= defs.length) return;
  await updateManagedFieldDef(tdb.therapistId, defs[i].id, { order: defs[j].order });
  await updateManagedFieldDef(tdb.therapistId, defs[j].id, { order: defs[i].order });
  revalidatePath(`${LIST}/${templateId}`);
}
