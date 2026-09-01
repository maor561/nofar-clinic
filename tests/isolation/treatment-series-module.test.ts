// @vitest-environment node
/**
 * Isolation for treatment series (WP-56). Templates + assignments are
 * therapist-scoped; the used-count advances only via appointments marked "done".
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type TherapistDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient, patientSeries } from "@/modules/patients/schema";
import {
  createSeriesTemplate,
  listSeriesTemplates,
  assignPatientSeries,
  getActivePatientSeries,
  cancelPatientSeries,
} from "@/modules/patients";
import { createAppointment, setAppointmentStatus } from "@/modules/appointments";

let db: Db;
let t1: string;
let t2: string;
let A: string;

function tdb(id: string): TherapistDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "therapist",
    therapistId: id,
    patientId: null,
    expiresAt: new Date(Date.now() + 1e4),
  }) as TherapistDb;
}

const H = 36e5;

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
  [A] = (
    await db
      .insert(patient)
      .values([{ therapistId: t1, firstName: "איי", lastName: "בדיקה" }])
      .returning({ id: patient.id })
  ).map((r) => r.id);
});

describe("series templates", () => {
  it("are therapist-scoped and reject duplicates", async () => {
    await createSeriesTemplate(tdb(t1), { name: "סדרת רפלקסולוגיה", sessionCount: 6 });
    await createSeriesTemplate(tdb(t2), { name: "סדרת תזונה", sessionCount: 4 });
    expect(await listSeriesTemplates(tdb(t1))).toHaveLength(1);
    expect(await listSeriesTemplates(tdb(t2))).toHaveLength(1);
    await expect(
      createSeriesTemplate(tdb(t1), { name: "סדרת רפלקסולוגיה", sessionCount: 3 }),
    ).rejects.toThrow("duplicate");
  });
});

describe("patient series + counter", () => {
  async function makeSeries(count: number) {
    await createSeriesTemplate(tdb(t1), { name: "סדרה", sessionCount: count });
    const [tpl] = await listSeriesTemplates(tdb(t1));
    await assignPatientSeries(tdb(t1), A, tpl.id);
  }

  it("assigns a snapshot and rejects a second active series", async () => {
    await makeSeries(3);
    const s = await getActivePatientSeries(tdb(t1), A);
    expect(s).toMatchObject({ name: "סדרה", sessionCount: 3, usedCount: 0, status: "active" });

    await createSeriesTemplate(tdb(t1), { name: "אחרת", sessionCount: 2 });
    const [tpl2] = (await listSeriesTemplates(tdb(t1))).filter((x) => x.name === "אחרת");
    await expect(assignPatientSeries(tdb(t1), A, tpl2.id)).rejects.toThrow("series_active_exists");
  });

  it("a 'done' appointment advances the counter; the series completes at the cap", async () => {
    await makeSeries(2);
    const mk = async () => {
      const s = new Date(Date.now() + 24 * H);
      const { id } = await createAppointment(tdb(t1), {
        patientId: A,
        startsAt: s,
        endsAt: new Date(s.getTime() + H),
      });
      return id;
    };
    const a1 = await mk();
    const a2 = await mk();

    const r1 = await setAppointmentStatus(tdb(t1), a1, "done");
    expect(r1.series).toMatchObject({ usedCount: 1, remaining: 1, justCompleted: false });

    const r2 = await setAppointmentStatus(tdb(t1), a2, "done");
    expect(r2.series).toMatchObject({ usedCount: 2, remaining: 0, justCompleted: true });

    const [row] = await db.select().from(patientSeries).where(eq(patientSeries.patientId, A));
    expect(row.status).toBe("completed");
    expect(row.completedAt).not.toBeNull();
  });

  it("reverting a 'done' appointment steps the counter back and re-opens the series", async () => {
    await makeSeries(1);
    const s = new Date(Date.now() + 24 * H);
    const { id } = await createAppointment(tdb(t1), {
      patientId: A,
      startsAt: s,
      endsAt: new Date(s.getTime() + H),
    });
    await setAppointmentStatus(tdb(t1), id, "done"); // completes it
    const back = await setAppointmentStatus(tdb(t1), id, "scheduled");
    expect(back.series).toMatchObject({ usedCount: 0, remaining: 1 });
    const [row] = await db.select().from(patientSeries).where(eq(patientSeries.patientId, A));
    expect(row.status).toBe("active");
    expect(row.usedCount).toBe(0);
    expect(row.completedAt).toBeNull();
  });

  it("cancel marks the series cancelled and frees a new assignment", async () => {
    await makeSeries(3);
    const s = await getActivePatientSeries(tdb(t1), A);
    await cancelPatientSeries(tdb(t1), s!.id);
    expect(await getActivePatientSeries(tdb(t1), A)).toBeNull();
  });
});
