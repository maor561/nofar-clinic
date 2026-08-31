"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPatientDb, getSchedulingView } from "@/modules/core/authz/server";
import { getTherapistUserId, getPatientUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import { bookSelfAppointment } from "@/modules/appointments";
import { computeOpenSlots } from "@/modules/availability";
import { clinicDateFmt } from "@/lib/tz";

const whenFmt = clinicDateFmt({ dateStyle: "full", timeStyle: "short" });
const DAY = 86_400_000;

export type BookState = { error?: string };

/**
 * A patient books an open slot (WP-35). The requested start is re-validated
 * against a fresh SchedulingView — availability, lead-time, horizon and overlap
 * with any currently-booked appointment — right before the guarded insert, so a
 * slot that filled up between page load and click is rejected cleanly.
 */
export async function bookSlotAction(_prev: BookState, fd: FormData): Promise<BookState> {
  const start = new Date(String(fd.get("start") ?? ""));
  if (Number.isNaN(start.getTime())) return { error: "שעה לא תקינה" };

  const view = await getSchedulingView();
  if (!view) return { error: "יש להתחבר מחדש" };

  const { policy: p, rules, blockedDates } = await view.config();
  if (!p?.selfSchedulingEnabled) return { error: "קביעת תורים עצמית אינה פעילה כרגע." };

  const policy = {
    slotMinutes: p.slotMinutes,
    granularityMinutes: p.granularityMinutes,
    leadHours: p.leadHours,
    horizonDays: p.horizonDays,
    bufferMinutes: p.bufferMinutes,
  };
  const end = new Date(start.getTime() + policy.slotMinutes * 60_000);

  const from = new Date(start.getTime() - DAY);
  const to = new Date(start.getTime() + DAY);
  const busy = await view.busyRanges(from, to);
  const open = computeOpenSlots({
    rules,
    blockedDates,
    busy,
    policy,
    from,
    to,
    now: new Date(),
  });
  if (!open.some((s) => s.getTime() === start.getTime())) {
    return { error: "השעה כבר לא פנויה. רעננו את העמוד ונסו שוב." };
  }

  const pdb = await getPatientDb();
  let id: string;
  try {
    ({ id } = await bookSelfAppointment(pdb, { startsAt: start, endsAt: end }));
  } catch {
    return { error: "קביעת הפגישה נכשלה. נסו שוב." };
  }

  const therapistUserId = await getTherapistUserId(pdb.therapistId);
  if (therapistUserId) {
    await notify({
      recipientUserId: therapistUserId,
      therapistId: pdb.therapistId,
      type: "appointment_scheduled",
      titleHe: "מטופל/ת קבע/ה פגישה",
      bodyHe: whenFmt.format(start),
      link: "/t/calendar",
      meta: { appointmentId: id },
    });
  }

  const patientUserId = await getPatientUserId(pdb.patientId);
  if (patientUserId) {
    await notify({
      recipientUserId: patientUserId,
      therapistId: pdb.therapistId,
      type: "appointment_scheduled",
      titleHe: "הפגישה שלך נקבעה",
      bodyHe: whenFmt.format(start),
      link: "/p/appointments",
      email: true,
      meta: { appointmentId: id },
    });
  }

  revalidatePath("/p/appointments");
  redirect("/p/appointments");
}
