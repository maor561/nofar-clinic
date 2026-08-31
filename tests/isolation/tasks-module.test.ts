// @vitest-environment node
/**
 * Isolation for the Tasks module (WP-15). The therapist assigns; the patient
 * marks done. Nothing crosses the tenant line — a patient handle can only ever
 * touch its own tasks — and every relevant change writes a timeline event.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import {
  scopedDbFor,
  type TherapistDb,
  type PatientDb,
  type ScopedAuditEvent,
} from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import {
  listTasks,
  listTaskRows,
  getTask,
  createTask,
  updateTask,
  setTaskStatus,
  deleteTask,
} from "@/modules/tasks";

let db: Db;
let t1: string;
let t2: string;
let A: string;
let B: string;
let audited: ScopedAuditEvent[];

function tdb(therapistId: string): TherapistDb {
  return scopedDbFor(
    db,
    {
      userId: "u",
      role: "therapist",
      therapistId,
      patientId: null,
      expiresAt: new Date(Date.now() + 1e4),
    },
    (e) => audited.push(e),
  ) as TherapistDb;
}
function pdb(therapistId: string, patientId: string): PatientDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "patient",
    therapistId,
    patientId,
    expiresAt: new Date(Date.now() + 1e4),
  }) as PatientDb;
}

beforeEach(async () => {
  db = await createTestDb();
  audited = [];
  [t1, t2] = (
    await db
      .insert(therapist)
      .values([
        { name: "נופר", email: "n@ex.co" },
        { name: "אחר", email: "o@ex.co" },
      ])
      .returning({ id: therapist.id })
  ).map((r) => r.id);
  [A, B] = (
    await db
      .insert(patient)
      .values([
        { therapistId: t1, firstName: "איי", lastName: "בדיקה" },
        { therapistId: t2, firstName: "בי", lastName: "בדיקה" },
      ])
      .returning({ id: patient.id })
  ).map((r) => r.id);
});

describe("cross-tenant", () => {
  it("a therapist never sees / touches another therapist's tasks", async () => {
    const { id } = await createTask(tdb(t2), { patientId: B, title: "לשתות מים" });

    expect(await listTasks(tdb(t1))).toEqual([]);
    expect(await getTask(tdb(t1), id)).toBeNull();
    await expect(updateTask(tdb(t1), id, { title: "פרוץ" })).rejects.toThrow("task_not_found");
    await deleteTask(tdb(t1), id); // scoped delete affects 0 rows, no throw
    expect((await getTask(tdb(t2), id))?.title).toBe("לשתות מים");
  });

  it("a therapist cannot create a task for another therapist's patient (WP-22)", async () => {
    await expect(createTask(tdb(t1), { patientId: B, title: "פרוץ" })).rejects.toThrow(
      "patient_not_found",
    );
  });

  it("a patient handle can only ever touch its own tasks", async () => {
    const mine = await createTask(tdb(t1), { patientId: A, title: "יומן אכילה" });
    const other = await createTask(tdb(t2), { patientId: B, title: "של מטופל אחר" });

    const rows = await listTaskRows(pdb(t1, A));
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(mine.id);

    await expect(setTaskStatus(pdb(t1, A), other.id, "done")).rejects.toThrow("task_not_found");
    const stillOpen = await getTask(tdb(t2), other.id);
    expect(stillOpen?.status).toBe("open");
  });
});

describe("lifecycle", () => {
  it("create writes a task_created timeline event + emits a create audit event", async () => {
    audited.length = 0;
    const { id } = await createTask(tdb(t1), {
      patientId: A,
      title: "הליכה 30 דקות",
      frequency: "daily",
    });

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl).toHaveLength(1);
    expect(tl[0].type).toBe("task_created");
    expect(tl[0].refId).toBe(id);
    expect(
      audited.some((e) => e.action === "create" && e.entity === "task" && e.entityId === id),
    ).toBe(true);
  });

  it("a patient completing a task stamps completed_at + writes task_completed", async () => {
    const { id } = await createTask(tdb(t1), { patientId: A, title: "מדידת משקל" });

    const res = await setTaskStatus(pdb(t1, A), id, "done");
    expect(res.changed).toBe(true);
    expect(res.therapistId).toBe(t1);

    const t = await getTask(tdb(t1), id);
    expect(t?.status).toBe("done");
    expect(t?.completedAt).toBeInstanceOf(Date);

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl.some((e) => e.type === "task_completed")).toBe(true);

    // idempotent: done -> done writes nothing new
    const again = await setTaskStatus(pdb(t1, A), id, "done");
    expect(again.changed).toBe(false);
    const tl2 = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl2.filter((e) => e.type === "task_completed")).toHaveLength(1);
  });

  it("reopening a task clears completed_at and adds no timeline event", async () => {
    const { id } = await createTask(tdb(t1), { patientId: A, title: "x" });
    await setTaskStatus(tdb(t1), id, "done");
    await setTaskStatus(tdb(t1), id, "open");

    const t = await getTask(tdb(t1), id);
    expect(t?.status).toBe("open");
    expect(t?.completedAt).toBeNull();

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    // task_created + one task_completed only (reopen adds nothing)
    expect(tl.map((e) => e.type).sort()).toEqual(["task_completed", "task_created"]);
  });
});

describe("filters", () => {
  it("filters by status", async () => {
    const a = await createTask(tdb(t1), { patientId: A, title: "פתוחה" });
    await createTask(tdb(t1), { patientId: A, title: "עוד פתוחה" });
    await setTaskStatus(tdb(t1), a.id, "done");

    expect((await listTasks(tdb(t1), { status: "open" })).map((t) => t.title)).toEqual([
      "עוד פתוחה",
    ]);
    expect((await listTasks(tdb(t1), { status: "done" })).map((t) => t.title)).toEqual(["פתוחה"]);
  });
});
