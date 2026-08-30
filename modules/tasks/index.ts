import { and, asc, desc, eq, inArray, type SQL, type InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { patient } from "@/modules/patients/schema";
import { recordEvent } from "@/modules/patient-file";
import { task } from "./schema";
import type { TaskFrequency, TaskStatus } from "./labels";

export {
  taskFrequency,
  taskStatus,
  TASK_FREQUENCY_LABEL,
  TASK_STATUS_LABEL,
  type TaskFrequency,
  type TaskStatus,
} from "./labels";

type AnyScoped = TherapistDb | PatientDb;

export type TaskRow = InferSelectModel<typeof task>;
export type TaskListItem = TaskRow & { patientName: string };

export type TaskInput = {
  patientId: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  frequency?: TaskFrequency;
};

function conds(f: { patientId?: string; status?: TaskStatus }): SQL | undefined {
  const c: SQL[] = [];
  if (f.patientId) c.push(eq(task.patientId, f.patientId));
  if (f.status) c.push(eq(task.status, f.status));
  return c.length ? and(...c) : undefined;
}

/** Raw task rows, guard-scoped. Works for either handle. */
export async function listTaskRows(
  db: AnyScoped,
  filter: { patientId?: string; status?: TaskStatus; limit?: number } = {},
): Promise<TaskRow[]> {
  return (db as TherapistDb).list(task, {
    where: conds(filter),
    // open first, then by soonest end date, newest created last
    orderBy: [asc(task.status), asc(task.endDate), desc(task.createdAt)],
    limit: Math.min(filter.limit ?? 200, 500),
  });
}

/** Therapist task list with the patient's display name attached. */
export async function listTasks(
  tdb: TherapistDb,
  filter: { patientId?: string; status?: TaskStatus; limit?: number } = {},
): Promise<TaskListItem[]> {
  const rows = await listTaskRows(tdb, filter);
  if (rows.length === 0) return [];
  const ids = [...new Set(rows.map((r) => r.patientId))];
  const people = await tdb.findMany(patient, inArray(patient.id, ids));
  const nameById = new Map(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));
  return rows.map((r) => ({ ...r, patientName: nameById.get(r.patientId) ?? "מטופל/ת" }));
}

export async function getTask(db: AnyScoped, id: string): Promise<TaskRow | null> {
  return (db as TherapistDb).findOne(task, eq(task.id, id));
}

export async function createTask(
  tdb: TherapistDb,
  input: TaskInput,
  createdBy?: string | null,
): Promise<{ id: string }> {
  const [row] = await tdb.insert(task, {
    patientId: input.patientId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    frequency: input.frequency ?? "once",
    status: "open",
    createdBy: createdBy ?? null,
  });

  await recordEvent(tdb, {
    patientId: input.patientId,
    type: "task_created",
    summary: `משימה חדשה — ${row.title}`,
    refId: row.id,
  });

  return { id: row.id };
}

export async function updateTask(
  tdb: TherapistDb,
  id: string,
  patch: Partial<TaskInput>,
): Promise<void> {
  const existing = await tdb.findOne(task, eq(task.id, id));
  if (!existing) throw new Error("task_not_found");

  const updated = await tdb.update(
    task,
    {
      title: patch.title?.trim() ?? existing.title,
      description:
        patch.description === undefined ? existing.description : patch.description?.trim() || null,
      startDate: patch.startDate === undefined ? existing.startDate : patch.startDate || null,
      endDate: patch.endDate === undefined ? existing.endDate : patch.endDate || null,
      frequency: patch.frequency ?? existing.frequency,
      updatedAt: new Date(),
    },
    eq(task.id, id),
  );
  if (updated.length === 0) throw new Error("task_not_found");
}

/**
 * Flip a task's status. Accepts either scoped handle — a patient can mark their
 * own task done. Records a `task_completed` timeline event on completion and
 * returns who/what so the caller can notify the therapist.
 */
export async function setTaskStatus(
  db: AnyScoped,
  id: string,
  status: TaskStatus,
): Promise<{ patientId: string; therapistId: string; title: string; changed: boolean }> {
  const existing = await (db as TherapistDb).findOne(task, eq(task.id, id));
  if (!existing) throw new Error("task_not_found");

  if (existing.status === status) {
    return {
      patientId: existing.patientId,
      therapistId: existing.therapistId,
      title: existing.title,
      changed: false,
    };
  }

  const rows = await (db as TherapistDb).update(
    task,
    { status, completedAt: status === "done" ? new Date() : null, updatedAt: new Date() },
    eq(task.id, id),
  );
  if (rows.length === 0) throw new Error("task_not_found");

  if (status === "done") {
    await recordEvent(db, {
      patientId: existing.patientId,
      type: "task_completed",
      summary: `משימה בוצעה — ${existing.title}`,
      refId: id,
    });
  }

  return {
    patientId: existing.patientId,
    therapistId: existing.therapistId,
    title: existing.title,
    changed: true,
  };
}

export async function deleteTask(tdb: TherapistDb, id: string): Promise<void> {
  await tdb.delete(task, eq(task.id, id));
}
