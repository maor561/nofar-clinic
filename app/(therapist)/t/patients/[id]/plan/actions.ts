"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import { requireTherapist } from "@/modules/core/auth/server";
import { getPatientUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { savePlanVersion, planFieldDefs, type FieldWriteInput } from "@/modules/plans";
import { getPatient } from "@/modules/patients";
import type { PlanFormState } from "./plan-form";

type Def = Awaited<ReturnType<typeof planFieldDefs>>[number];

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

export async function savePlanAction(
  patientId: string,
  _prev: PlanFormState,
  fd: FormData,
): Promise<PlanFormState> {
  const session = await requireTherapist();
  const tdb = await getTherapistDb();

  const p = await getPatient(tdb, patientId);
  if (!p) return { error: "מטופל/ת לא נמצא/ה" };

  const note = String(fd.get("note") ?? "").trim() || null;
  const defs = await planFieldDefs(tdb);

  let versionNo: number;
  try {
    ({ versionNo } = await savePlanVersion(tdb, {
      patientId,
      note,
      fields: parseFields(fd, defs),
      createdBy: session.userId,
    }));
  } catch (e) {
    console.error("[savePlanAction] savePlanVersion failed:", e);
    return { error: "שמירת התוכנית נכשלה. נסו שוב." };
  }

  // notify the patient — plan_changed is a critical type, so notify() also emails
  const patientUserId = await getPatientUserId(patientId);
  if (patientUserId) {
    await notify({
      recipientUserId: patientUserId,
      therapistId: tdb.therapistId,
      type: "plan_changed",
      titleHe: "תוכנית הטיפול שלך עודכנה",
      bodyHe: note ?? `עודכנה גרסה ${versionNo}`,
      link: "/p/plan",
    });
  }

  revalidatePath(`/t/patients/${patientId}/plan`);
  revalidatePath(`/t/patients/${patientId}`);
  revalidatePath("/p/plan");
  redirect(`/t/patients/${patientId}/plan`);
}
