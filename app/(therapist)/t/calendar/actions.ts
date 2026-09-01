"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTherapistDb } from "@/modules/core/authz/server";
import type { TherapistDb } from "@/modules/core/authz";
import { getPatientUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import {
  createAppointment,
  updateAppointment,
  getAppointment,
  listAppointmentRows,
  setAppointmentStatus,
  appointmentStatus,
  type AppointmentInput,
  type AppointmentStatus,
} from "@/modules/appointments";
import { getPatient, treatmentType, type TreatmentType } from "@/modules/patients";
import { syncAppointment, googleBusy } from "@/modules/calendar-sync";
import { fromClinicWallTime, clinicDateFmt } from "@/lib/tz";
import type { AppointmentFormState } from "./appointment-form";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HOUR = 3_600_000;
const overlap = (aS: number, aE: number, bS: number, bE: number) => aS < bE && aE > bS;

/**
 * A blocking check before a therapist writes an appointment: does [start,end]
 * clash with an existing (non-cancelled) appointment or a Google busy window?
 * Returns a message to surface, or null if the slot is free. The therapist can
 * override by ticking "allowConflict".
 */
async function conflictMessage(
  tdb: TherapistDb,
  start: Date,
  end: Date,
  excludeId?: string,
): Promise<string | null> {
  const s = start.getTime();
  const e = end.getTime();
  const suffix = ' — סמנו "אפשר קביעה גם אם יש חפיפה" כדי להמשיך בכל זאת.';

  const rows = await listAppointmentRows(tdb, {
    from: new Date(s - 12 * HOUR),
    to: new Date(e + 12 * HOUR),
    limit: 100,
  });
  for (const r of rows) {
    if (r.id === excludeId || r.status === "cancelled") continue;
    if (overlap(s, e, r.startsAt.getTime(), r.endsAt.getTime())) {
      return "השעה מתנגשת עם פגישה קיימת ביומן" + suffix;
    }
  }

  const busy = await googleBusy(tdb.therapistId, new Date(s - HOUR), new Date(e + HOUR));
  for (const b of busy) {
    if (overlap(s, e, b.start.getTime(), b.end.getTime())) {
      return "השעה מתנגשת עם חסימה ביומן Google" + suffix;
    }
  }
  return null;
}

function parse(fd: FormData): { input: AppointmentInput; error?: string } {
  const patientId = String(fd.get("patientId") ?? "");
  const date = String(fd.get("date") ?? "");
  const time = String(fd.get("time") ?? "");
  const durationMin = Number(fd.get("durationMin") ?? 60);
  const ttRaw = String(fd.get("treatmentType") ?? "none");
  const notes = String(fd.get("notes") ?? "").trim() || null;

  const blank: AppointmentInput = {
    patientId: "",
    startsAt: new Date(0),
    endsAt: new Date(0),
  };
  if (!UUID_RE.test(patientId)) return { input: blank, error: "בחרו מטופל/ת" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    return { input: blank, error: "תאריך או שעה לא תקינים" };
  if (!Number.isFinite(durationMin) || durationMin < 5 || durationMin > 480)
    return { input: blank, error: "משך לא תקין" };

  const startsAt = fromClinicWallTime(date, time);
  const endsAt = new Date(startsAt.getTime() + durationMin * 60_000);
  const tt: TreatmentType | null = (treatmentType as readonly string[]).includes(ttRaw)
    ? (ttRaw as TreatmentType)
    : null;

  return { input: { patientId, startsAt, endsAt, treatmentType: tt, notes } };
}

const whenFmt = clinicDateFmt({ dateStyle: "full", timeStyle: "short" });

export async function createAppointmentAction(
  _prev: AppointmentFormState,
  fd: FormData,
): Promise<AppointmentFormState> {
  const { input, error } = parse(fd);
  if (error) return { error };

  const tdb = await getTherapistDb();

  if (fd.get("allowConflict") == null) {
    const conflict = await conflictMessage(tdb, input.startsAt, input.endsAt);
    if (conflict) return { error: conflict };
  }

  let id: string;
  try {
    ({ id } = await createAppointment(tdb, input));
  } catch {
    return { error: "קביעת הפגישה נכשלה. נסו שוב." };
  }

  const p = await getPatient(tdb, input.patientId);
  void syncAppointment(tdb.therapistId, {
    id,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    patientFirstName: p?.firstName ?? "מטופל/ת",
    gcalEventId: null,
  });

  const patientUserId = await getPatientUserId(input.patientId);
  if (patientUserId) {
    await notify({
      recipientUserId: patientUserId,
      therapistId: tdb.therapistId,
      type: "appointment_scheduled",
      titleHe: "נקבעה לך פגישה",
      bodyHe: whenFmt.format(input.startsAt),
      link: "/p/appointments",
      meta: { appointmentId: id },
    });
  }

  revalidatePath("/t/calendar");
  redirect(`/t/calendar/${id}`);
}

export async function updateAppointmentAction(
  id: string,
  _prev: AppointmentFormState,
  fd: FormData,
): Promise<AppointmentFormState> {
  const { input, error } = parse(fd);
  if (error) return { error };

  const tdb = await getTherapistDb();

  if (fd.get("allowConflict") == null) {
    const conflict = await conflictMessage(tdb, input.startsAt, input.endsAt, id);
    if (conflict) return { error: conflict };
  }

  try {
    await updateAppointment(tdb, id, {
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      treatmentType: input.treatmentType,
      notes: input.notes,
    });
  } catch {
    return { error: "עדכון הפגישה נכשל." };
  }

  const appt = await getAppointment(tdb, id);
  if (appt) {
    void syncAppointment(tdb.therapistId, {
      id,
      startsAt: appt.startsAt,
      endsAt: appt.endsAt,
      patientFirstName: appt.patientName.split(" ")[0] || "מטופל/ת",
      gcalEventId: appt.gcalEventId,
    });
  }

  const patientUserId = await getPatientUserId(input.patientId);
  if (patientUserId) {
    await notify({
      recipientUserId: patientUserId,
      therapistId: tdb.therapistId,
      type: "appointment_changed",
      titleHe: "הפגישה שלך עודכנה",
      bodyHe: whenFmt.format(input.startsAt),
      link: "/p/appointments",
      meta: { appointmentId: id },
    });
  }

  revalidatePath("/t/calendar");
  revalidatePath(`/t/calendar/${id}`);
  redirect(`/t/calendar/${id}`);
}

export async function setStatusAction(id: string, status: string): Promise<void> {
  if (!(appointmentStatus as readonly string[]).includes(status)) return;
  const tdb = await getTherapistDb();

  let patientId: string;
  try {
    ({ patientId } = await setAppointmentStatus(tdb, id, status as AppointmentStatus));
  } catch {
    return;
  }

  if (status === "cancelled") {
    const appt = await getAppointment(tdb, id);
    if (appt?.gcalEventId) {
      void syncAppointment(tdb.therapistId, {
        id,
        startsAt: appt.startsAt,
        endsAt: appt.endsAt,
        patientFirstName: "",
        gcalEventId: appt.gcalEventId,
        cancelled: true,
      });
    }

    const patientUserId = await getPatientUserId(patientId);
    if (patientUserId) {
      await notify({
        recipientUserId: patientUserId,
        therapistId: tdb.therapistId,
        type: "appointment_cancelled",
        titleHe: "פגישה בוטלה",
        bodyHe: "אחת מהפגישות שלך בוטלה. לפרטים פנו למטפלת.",
        link: "/p/appointments",
        meta: { appointmentId: id },
      });
    }
  }

  revalidatePath("/t/calendar");
  revalidatePath(`/t/calendar/${id}`);
}
