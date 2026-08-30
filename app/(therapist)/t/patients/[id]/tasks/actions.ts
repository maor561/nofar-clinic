"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTherapistDb, getScopedDb } from "@/modules/core/authz/server";
import { requireTherapist } from "@/modules/core/auth/server";
import { getPatientUserId, getTherapistUserId } from "@/modules/core/auth";
import { notify } from "@/modules/core/notifications";
import {
  createTask,
  updateTask,
  setTaskStatus,
  deleteTask,
  taskFrequency,
  taskStatus,
  type TaskInput,
  type TaskFrequency,
  type TaskStatus,
} from "@/modules/tasks";
import type { TaskFormState } from "./task-form";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parse(fd: FormData, patientId: string): TaskInput {
  const s = (k: string) => {
    const v = fd.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  const freqRaw = String(fd.get("frequency") ?? "once");
  const frequency: TaskFrequency = (taskFrequency as readonly string[]).includes(freqRaw)
    ? (freqRaw as TaskFrequency)
    : "once";
  const startDate = s("startDate");
  const endDate = s("endDate");
  return {
    patientId,
    title: s("title") ?? "",
    description: s("description"),
    startDate: startDate && DATE_RE.test(startDate) ? startDate : null,
    endDate: endDate && DATE_RE.test(endDate) ? endDate : null,
    frequency,
  };
}

export async function createTaskAction(
  patientId: string,
  _prev: TaskFormState,
  fd: FormData,
): Promise<TaskFormState> {
  const session = await requireTherapist();
  const input = parse(fd, patientId);
  if (!input.title) return { error: "כותרת המשימה היא שדה חובה" };

  const tdb = await getTherapistDb();
  let id: string;
  try {
    ({ id } = await createTask(tdb, input, session.userId));
  } catch {
    return { error: "יצירת המשימה נכשלה. נסו שוב." };
  }

  const patientUserId = await getPatientUserId(patientId);
  if (patientUserId) {
    await notify({
      recipientUserId: patientUserId,
      therapistId: tdb.therapistId,
      type: "task_assigned",
      titleHe: "משימה חדשה עבורך",
      bodyHe: input.title,
      link: "/p/tasks",
      meta: { taskId: id },
    });
  }

  revalidatePath(`/t/patients/${patientId}/tasks`);
  revalidatePath(`/t/patients/${patientId}`);
  redirect(`/t/patients/${patientId}/tasks`);
}

export async function updateTaskAction(
  taskId: string,
  patientId: string,
  _prev: TaskFormState,
  fd: FormData,
): Promise<TaskFormState> {
  const input = parse(fd, patientId);
  if (!input.title) return { error: "כותרת המשימה היא שדה חובה" };

  const tdb = await getTherapistDb();
  try {
    await updateTask(tdb, taskId, input);
  } catch {
    return { error: "עדכון המשימה נכשל." };
  }

  revalidatePath(`/t/patients/${patientId}/tasks`);
  redirect(`/t/patients/${patientId}/tasks`);
}

/** Toggle status — works for the therapist page and the patient page alike. */
export async function setTaskStatusAction(taskId: string, status: string): Promise<void> {
  if (!(taskStatus as readonly string[]).includes(status)) return;
  const db = await getScopedDb();
  if (!db) return;

  let res: Awaited<ReturnType<typeof setTaskStatus>>;
  try {
    res = await setTaskStatus(db, taskId, status as TaskStatus);
  } catch {
    return;
  }

  // patient completed a task -> let the therapist know
  if (res.changed && status === "done" && db.role === "patient") {
    const therapistUserId = await getTherapistUserId(res.therapistId);
    if (therapistUserId) {
      await notify({
        recipientUserId: therapistUserId,
        therapistId: res.therapistId,
        type: "task_completed",
        titleHe: "משימה סומנה כבוצעה",
        bodyHe: res.title,
        link: `/t/patients/${res.patientId}/tasks`,
        meta: { taskId },
      });
    }
  }

  revalidatePath(`/t/patients/${res.patientId}/tasks`);
  revalidatePath(`/t/patients/${res.patientId}`);
  revalidatePath("/p/tasks");
}

export async function deleteTaskAction(taskId: string, patientId: string): Promise<void> {
  const tdb = await getTherapistDb();
  await deleteTask(tdb, taskId);
  revalidatePath(`/t/patients/${patientId}/tasks`);
  redirect(`/t/patients/${patientId}/tasks`);
}
