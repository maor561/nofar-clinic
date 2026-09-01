"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import {
  createSession,
  updateSession,
  sessionFieldDefs,
  type SessionInput,
  type FieldWriteInput,
} from "@/modules/sessions";
import type { SessionFormState } from "./session-form";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function baseInput(fd: FormData, patientId: string, appointmentId: string | null): SessionInput {
  const treatmentTypes = fd
    .getAll("treatmentTypes")
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim());
  return {
    patientId,
    appointmentId,
    date: str(fd, "date") ?? "",
    treatmentTypes,
    patientReport: str(fd, "patientReport"),
    complaints: str(fd, "complaints"),
    changesSinceLast: str(fd, "changesSinceLast"),
    treatmentDone: str(fd, "treatmentDone"),
    recommendations: str(fd, "recommendations"),
    therapistNotes: str(fd, "therapistNotes"),
    nextFocus: str(fd, "nextFocus"),
  };
}

type Def = Awaited<ReturnType<typeof sessionFieldDefs>>[number];

function parseFields(fd: FormData, defs: Def[]): FieldWriteInput[] {
  const out: FieldWriteInput[] = [];
  for (const def of defs) {
    const name = `field:${def.id}`;
    const raw = fd.getAll(name).filter((x): x is string => typeof x === "string");
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
        value = s.multiple ? raw.filter((x) => x !== "") : (raw[0] ?? null) || null;
        break;
      }
      default:
        value = raw[0]?.trim() ? raw[0].trim() : null;
    }
    out.push({ definitionId: def.id, value });
  }
  return out;
}

export async function createSessionAction(
  patientId: string,
  appointmentId: string | null,
  _prev: SessionFormState,
  fd: FormData,
): Promise<SessionFormState> {
  if (!UUID_RE.test(patientId)) return { error: "מטופל/ת לא תקין/ה" };
  const input = baseInput(
    fd,
    patientId,
    appointmentId && UUID_RE.test(appointmentId) ? appointmentId : null,
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { error: "בחרו תאריך למפגש" };

  const tdb = await getTherapistDb();
  const defs = await sessionFieldDefs(tdb);

  let id: string;
  try {
    ({ id } = await createSession(tdb, input, parseFields(fd, defs)));
  } catch (e) {
    return {
      error:
        e instanceof Error && e.message === "appointment_not_found"
          ? "הפגישה המקושרת אינה תקינה"
          : "שמירת המפגש נכשלה.",
    };
  }

  revalidatePath(`/t/patients/${patientId}`);
  redirect(`/t/sessions/${id}`);
}

export async function updateSessionAction(
  id: string,
  patientId: string,
  _prev: SessionFormState,
  fd: FormData,
): Promise<SessionFormState> {
  const input = baseInput(fd, patientId, null);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return { error: "בחרו תאריך למפגש" };

  const tdb = await getTherapistDb();
  const defs = await sessionFieldDefs(tdb);

  try {
    await updateSession(
      tdb,
      id,
      {
        date: input.date,
        treatmentTypes: input.treatmentTypes,
        patientReport: input.patientReport,
        complaints: input.complaints,
        changesSinceLast: input.changesSinceLast,
        treatmentDone: input.treatmentDone,
        recommendations: input.recommendations,
        therapistNotes: input.therapistNotes,
        nextFocus: input.nextFocus,
      },
      parseFields(fd, defs),
    );
  } catch {
    return { error: "עדכון המפגש נכשל." };
  }

  revalidatePath(`/t/patients/${patientId}`);
  revalidatePath(`/t/sessions/${id}`);
  redirect(`/t/sessions/${id}`);
}
