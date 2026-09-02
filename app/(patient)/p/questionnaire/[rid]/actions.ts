"use server";

import { revalidatePath } from "next/cache";
import { getPatientDb } from "@/modules/core/authz/server";
import { getTherapistUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import {
  getResponseDetail,
  templateQuestions,
  submitResponse,
  type FieldWriteInput,
} from "@/modules/questionnaires";
import { fieldDefinitionsFor } from "@/modules/core/fields";
import type { QFormState } from "../questionnaire-form";

type Def = { id: string; type: string; schema: unknown };

function parseFields(fd: FormData, defs: Def[]): FieldWriteInput[] {
  return defs.map((def) => {
    const raw = fd.getAll(`field:${def.id}`).filter((x): x is string => typeof x === "string");
    let value: unknown;
    switch (def.type) {
      case "scale":
      case "number":
        value = raw[0] && raw[0] !== "" ? Number(raw[0]) : null;
        if (typeof value === "number" && Number.isNaN(value)) value = null;
        break;
      case "boolean":
        value = raw.includes("true");
        break;
      case "select": {
        const s = def.schema as { multiple?: boolean };
        value = s.multiple ? raw.filter((x) => x !== "") : raw[0]?.trim() || null;
        break;
      }
      default:
        value = raw[0]?.trim() ? raw[0].trim() : null;
    }
    return { definitionId: def.id, value };
  });
}

export async function submitResponseAction(
  rid: string,
  _prev: QFormState,
  fd: FormData,
): Promise<QFormState> {
  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return { error: "יש להתחבר מחדש" };

  const detail = await getResponseDetail(pdb, rid);
  if (!detail) return { error: "השאלון לא נמצא." };

  const defs = detail.response.templateId
    ? await templateQuestions(pdb, detail.response.templateId)
    : await fieldDefinitionsFor(pdb.therapistId, "questionnaire", null);

  let firstSubmit = false;
  try {
    ({ firstSubmit } = await submitResponse(pdb, rid, parseFields(fd, defs)));
  } catch {
    return { error: "שליחת השאלון נכשלה. בדקו את התשובות ונסו שוב." };
  }

  if (firstSubmit) {
    const therapistUserId = await getTherapistUserId(pdb.therapistId);
    if (therapistUserId) {
      await notify({
        recipientUserId: therapistUserId,
        therapistId: pdb.therapistId,
        type: "questionnaire_submitted",
        titleHe: "שאלון מולא",
        bodyHe: `${me.firstName} ${me.lastName} השלים/ה: ${detail.template?.name ?? "שאלון קליטה"}.`,
        link: `/t/patients/${me.id}/questionnaire`,
        meta: { patientId: me.id },
      });
    }
  }

  revalidatePath("/p/questionnaire");
  revalidatePath(`/t/patients/${me.id}/questionnaire`);
  revalidatePath(`/t/patients/${me.id}`);
  return { ok: Date.now() };
}
