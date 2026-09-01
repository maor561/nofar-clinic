"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import { requireTherapist } from "@/modules/core/auth/server";
import {
  createPatient,
  updatePatient,
  type PatientInput,
  type ConsentKind,
  patientStatus,
  consentKind,
} from "@/modules/patients";
import { provisionPatientUser, createPatientInvite } from "@/modules/core/auth";
import { sendInviteEmail } from "@/modules/core/email";
import type { PatientFormState } from "./patient-form";

function parse(fd: FormData): PatientInput {
  const str = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const list = <T extends string>(k: string, allowed: readonly T[]): T[] =>
    fd
      .getAll(k)
      .filter((x): x is T => typeof x === "string" && (allowed as readonly string[]).includes(x));

  const statusRaw = fd.get("status");
  const status =
    typeof statusRaw === "string" && (patientStatus as readonly string[]).includes(statusRaw)
      ? (statusRaw as PatientInput["status"])
      : undefined;

  return {
    firstName: str("firstName") ?? "",
    lastName: str("lastName") ?? "",
    dob: str("dob"),
    phone: str("phone"),
    email: str("email"),
    address: str("address"),
    treatmentGoal: str("treatmentGoal"),
    generalNotes: str("generalNotes"),
    status,
    treatmentTypes: fd
      .getAll("treatmentTypes")
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim()),
    consents: list<ConsentKind>("consents", consentKind),
  };
}

export async function createPatientAction(
  _prev: PatientFormState,
  fd: FormData,
): Promise<PatientFormState> {
  const input = parse(fd);
  if (!input.firstName || !input.lastName) return { error: "שם פרטי ושם משפחה הם שדות חובה" };

  const session = await requireTherapist();
  const tdb = await getTherapistDb();

  let id: string;
  try {
    ({ id } = await createPatient(tdb, input));
  } catch {
    return { error: "יצירת המטופל נכשלה. נסו שוב." };
  }

  // provision the login account + one-click invite (email if we have one)
  if (input.email) {
    try {
      await provisionPatientUser({
        therapistId: session.therapistId,
        patientId: id,
        email: input.email,
      });
      const { token } = await createPatientInvite({
        therapistId: session.therapistId,
        patientId: id,
        email: input.email,
      });
      await sendInviteEmail(input.email, { token, patientName: input.firstName });
    } catch {
      // account/invite is best-effort here; the patient row exists
    }
  }

  revalidatePath("/t/patients");
  redirect(`/t/patients/${id}`);
}

export async function updatePatientAction(
  id: string,
  _prev: PatientFormState,
  fd: FormData,
): Promise<PatientFormState> {
  const input = parse(fd);
  if (!input.firstName || !input.lastName) return { error: "שם פרטי ושם משפחה הם שדות חובה" };

  const tdb = await getTherapistDb();
  try {
    await updatePatient(tdb, id, input);
  } catch {
    return { error: "עדכון המטופל נכשל." };
  }
  revalidatePath(`/t/patients/${id}`);
  revalidatePath("/t/patients");
  redirect(`/t/patients/${id}`);
}
