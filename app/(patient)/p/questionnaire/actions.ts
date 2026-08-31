"use server";

import { revalidatePath } from "next/cache";
import { getPatientDb } from "@/modules/core/authz/server";
import { getTherapistUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import {
  submitQuestionnaire,
  questionnaireFieldDefs,
  type FieldWriteInput,
} from "@/modules/questionnaires";
import type { QFormState } from "./questionnaire-form";

type Def = Awaited<ReturnType<typeof questionnaireFieldDefs>>[number];

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

export async function submitQuestionnaireAction(
  _prev: QFormState,
  fd: FormData,
): Promise<QFormState> {
  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return { error: "יש להתחבר מחדש" };

  const defs = await questionnaireFieldDefs(pdb);

  try {
    await submitQuestionnaire(pdb, me.id, parseFields(fd, defs));
  } catch {
    return { error: "שליחת השאלון נכשלה. בדקו את התשובות ונסו שוב." };
  }

  const therapistUserId = await getTherapistUserId(pdb.therapistId);
  if (therapistUserId) {
    await notify({
      recipientUserId: therapistUserId,
      therapistId: pdb.therapistId,
      type: "questionnaire_submitted",
      titleHe: "שאלון קליטה מולא",
      bodyHe: `${me.firstName} ${me.lastName} השלים/ה את שאלון הקליטה.`,
      link: `/t/patients/${me.id}/questionnaire`,
      meta: { patientId: me.id },
    });
  }

  revalidatePath("/p/questionnaire");
  revalidatePath(`/t/patients/${me.id}/questionnaire`);
  revalidatePath(`/t/patients/${me.id}`);
  return { ok: Date.now() };
}
