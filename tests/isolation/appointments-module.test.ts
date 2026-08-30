// @vitest-environment node
/**
 * Isolation for the Appointments module (WP-12). The therapist manages one
 * diary; a patient sees only their own appointments. Every mutation writes a
 * timeline event and is auto-audited.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import {
  scopedDbFor,
  type PatientDb,
  type TherapistDb,
  type ScopedAuditEvent,
} from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import {
  listAppointments,
  listAppointmentRows,
  getAppointment,
  createAppointment,
  updateAppointment,
  setAppointmentStatus,
} from "@/modules/appointments";

let db: Db;
let t1: string;
let t2: string;
let A: string; // patient under t1
let B: string; // patient under t2
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

const H = 36e5;
const soon = () => new Date(Date.now() + 24 * H);

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
  it("a therapist never sees / touches another therapist's appointments", async () => {
    const start = soon();
    const { id } = await createAppointment(tdb(t2), {
      patientId: B,
      startsAt: start,
      endsAt: new Date(start.getTime() + H),
    });

    expect(await listAppointments(tdb(t1))).toEqual([]);
    expect(await getAppointment(tdb(t1), id)).toBeNull();
    await expect(updateAppointment(tdb(t1), id, { notes: "פרוץ" })).rejects.toThrow(
      "appointment_not_found",
    );
    await expect(setAppointmentStatus(tdb(t1), id, "cancelled")).rejects.toThrow(
      "appointment_not_found",
    );

    // untouched
    expect((await getAppointment(tdb(t2), id))?.status).toBe("scheduled");
  });

  it("a patient handle only ever yields its own appointments", async () => {
    const s1 = soon();
    await createAppointment(tdb(t1), {
      patientId: A,
      startsAt: s1,
      endsAt: new Date(s1.getTime() + H),
    });
    const s2 = soon();
    await createAppointment(tdb(t2), {
      patientId: B,
      startsAt: s2,
      endsAt: new Date(s2.getTime() + H),
    });

    const mine = await listAppointmentRows(pdb(t1, A));
    expect(mine).toHaveLength(1);
    expect(mine[0].patientId).toBe(A);
    // a patient scope can't reach the other tenant's rows even by filter
    expect(await listAppointmentRows(pdb(t1, A), { patientId: B })).toEqual([]);
  });
});

describe("side-effects", () => {
  it("create writes an 'appointment' timeline event + emits a create audit event", async () => {
    audited.length = 0;
    const start = soon();
    const { id } = await createAppointment(tdb(t1), {
      patientId: A,
      startsAt: start,
      endsAt: new Date(start.getTime() + H),
      treatmentType: "naturopathy",
    });

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl).toHaveLength(1);
    expect(tl[0].type).toBe("appointment");
    expect(tl[0].refId).toBe(id);

    expect(
      audited.some((e) => e.action === "create" && e.entity === "appointment" && e.entityId === id),
    ).toBe(true);
  });

  it("reschedule + status changes each record a timeline event", async () => {
    const start = soon();
    const { id } = await createAppointment(tdb(t1), {
      patientId: A,
      startsAt: start,
      endsAt: new Date(start.getTime() + H),
    });

    await updateAppointment(tdb(t1), id, {
      startsAt: new Date(start.getTime() + 3 * H),
      endsAt: new Date(start.getTime() + 4 * H),
    });
    const { patientId } = await setAppointmentStatus(tdb(t1), id, "done");
    expect(patientId).toBe(A);

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    const summaries = tl.map((e) => e.summary);
    expect(summaries.some((s) => s.startsWith("פגישה נקבעה"))).toBe(true);
    expect(summaries.some((s) => s.startsWith("הפגישה הועברה"))).toBe(true);
    expect(summaries.some((s) => s.startsWith("הפגישה התקיימה"))).toBe(true);
  });

  it("a no-op status change writes no extra event", async () => {
    const start = soon();
    const { id } = await createAppointment(tdb(t1), {
      patientId: A,
      startsAt: start,
      endsAt: new Date(start.getTime() + H),
    });
    await setAppointmentStatus(tdb(t1), id, "scheduled"); // already scheduled
    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl).toHaveLength(1);
  });
});

describe("filters", () => {
  it("filters by date window and status", async () => {
    const base = Date.now() + 24 * H;
    const mk = async (offsetH: number, status?: "done") => {
      const s = new Date(base + offsetH * H);
      const { id } = await createAppointment(tdb(t1), {
        patientId: A,
        startsAt: s,
        endsAt: new Date(s.getTime() + H),
      });
      if (status) await setAppointmentStatus(tdb(t1), id, status);
    };
    await mk(0);
    await mk(48, "done");
    await mk(120);

    const window = await listAppointments(tdb(t1), {
      from: new Date(base - H),
      to: new Date(base + 72 * H),
    });
    expect(window).toHaveLength(2);

    const done = await listAppointments(tdb(t1), { status: "done" });
    expect(done).toHaveLength(1);
    expect(done[0].patientName).toBe("איי בדיקה");
  });
});
