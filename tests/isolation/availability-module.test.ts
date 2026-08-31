// @vitest-environment node
/**
 * Isolation for the Availability / self-booking module (WP-28 / WP-29).
 * Availability config is therapist-scoped; a patient can only ever book an
 * appointment for themselves, and never sees another tenant's rows.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type PatientDb, type TherapistDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import { appointment } from "@/modules/appointments/schema";
import { bookSelfAppointment, listAppointmentRows } from "@/modules/appointments";
import {
  getAvailabilitySettings,
  saveAvailability,
  addBlockedDate,
  DEFAULT_POLICY,
} from "@/modules/availability";

let db: Db;
let t1: string;
let t2: string;
let A: string;
let B: string;

function tdb(therapistId: string): TherapistDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "therapist",
    therapistId,
    patientId: null,
    expiresAt: new Date(Date.now() + 1e4),
  }) as TherapistDb;
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
const slot = () => {
  const s = new Date(Date.now() + 48 * H);
  return { startsAt: s, endsAt: new Date(s.getTime() + H) };
};

const SAMPLE = {
  policy: { ...DEFAULT_POLICY, selfSchedulingEnabled: true, slotMinutes: 45 },
  rules: [{ weekday: 1, startMinute: 540, endMinute: 1020 }],
};

beforeEach(async () => {
  db = await createTestDb();
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

describe("availability config", () => {
  it("defaults to an in-memory policy with self-scheduling off", async () => {
    const s = await getAvailabilitySettings(tdb(t1));
    expect(s.policyPersisted).toBe(false);
    expect(s.policy).toEqual(DEFAULT_POLICY);
    expect(s.rules).toEqual([]);
  });

  it("is invisible across therapists", async () => {
    await saveAvailability(tdb(t1), SAMPLE);
    await addBlockedDate(tdb(t1), "2099-01-02", "חופשה");

    const mine = await getAvailabilitySettings(tdb(t1));
    expect(mine.policy.selfSchedulingEnabled).toBe(true);
    expect(mine.policy.slotMinutes).toBe(45);
    expect(mine.rules).toHaveLength(1);
    expect(mine.exceptions).toHaveLength(1);

    const other = await getAvailabilitySettings(tdb(t2));
    expect(other.policyPersisted).toBe(false);
    expect(other.rules).toEqual([]);
    expect(other.exceptions).toEqual([]);
  });

  it("replaces rules rather than appending", async () => {
    await saveAvailability(tdb(t1), SAMPLE);
    await saveAvailability(tdb(t1), {
      policy: SAMPLE.policy,
      rules: [
        { weekday: 2, startMinute: 600, endMinute: 720 },
        { weekday: 3, startMinute: 600, endMinute: 720 },
      ],
    });
    const s = await getAvailabilitySettings(tdb(t1));
    expect(s.rules.map((r) => r.weekday).sort()).toEqual([2, 3]);
  });

  it("rejects an invalid window", async () => {
    await expect(
      saveAvailability(tdb(t1), {
        policy: SAMPLE.policy,
        rules: [{ weekday: 1, startMinute: 800, endMinute: 700 }],
      }),
    ).rejects.toThrow("invalid_availability");
  });
});

describe("self-booking", () => {
  it("a patient books only for themselves, under their own therapist", async () => {
    const { startsAt, endsAt } = slot();
    const { id } = await bookSelfAppointment(pdb(t1, A), { startsAt, endsAt });

    const row = await db.select().from(appointment).where(eq(appointment.id, id));
    expect(row[0].patientId).toBe(A);
    expect(row[0].therapistId).toBe(t1);
    expect(row[0].status).toBe("scheduled");

    // the other tenant's patient handle never sees it
    expect(await listAppointmentRows(pdb(t2, B))).toEqual([]);
    // and it is on the patient's own list
    const mine = await listAppointmentRows(pdb(t1, A));
    expect(mine).toHaveLength(1);
    expect(mine[0].id).toBe(id);
  });

  it("writes an 'appointment' timeline event for that patient only", async () => {
    const { startsAt, endsAt } = slot();
    await bookSelfAppointment(pdb(t1, A), { startsAt, endsAt });

    const forA = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(forA).toHaveLength(1);
    expect(forA[0].type).toBe("appointment");

    const forB = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, B));
    expect(forB).toEqual([]);
  });
});
