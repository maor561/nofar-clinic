// @vitest-environment node
/**
 * Isolation for the Treatment Sessions module (WP-13). Session records and their
 * per-domain field values never cross the tenant line; every session writes a
 * timeline event and is auto-audited.
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
import { loadRegistryInto, getFieldValuesFrom } from "@/modules/core/fields";
import { createAppointment } from "@/modules/appointments";
import {
  listSessions,
  getSession,
  createSession,
  updateSession,
  sessionFieldDefs,
  listSharedSummaries,
} from "@/modules/sessions";

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
  await loadRegistryInto(db, t1);
  await loadRegistryInto(db, t2);
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

function pdb(therapistId: string, patientId: string): PatientDb {
  return scopedDbFor(db, {
    userId: "u",
    role: "patient",
    therapistId,
    patientId,
    expiresAt: new Date(Date.now() + 1e4),
  }) as PatientDb;
}

async function weightDefId(therapistId: string): Promise<string> {
  const defs = await sessionFieldDefs(tdb(therapistId));
  return defs.find((d) => d.key === "weight_kg")!.id;
}

describe("cross-tenant", () => {
  it("a therapist never sees / touches another therapist's sessions", async () => {
    const { id } = await createSession(tdb(t2), { patientId: B, date: "2026-08-01" });

    expect(await listSessions(tdb(t1))).toEqual([]);
    expect(await getSession(tdb(t1), id)).toBeNull();
    await expect(updateSession(tdb(t1), id, { date: "2026-09-09" })).rejects.toThrow(
      "session_not_found",
    );
    expect((await getSession(tdb(t2), id))?.date).toBe("2026-08-01");
  });

  it("field values are scoped to the owning therapist AND patient", async () => {
    const wid = await weightDefId(t1);
    const { id } = await createSession(tdb(t1), { patientId: A, date: "2026-08-02" }, [
      { definitionId: wid, value: 71 },
    ]);

    expect(
      await getFieldValuesFrom({ therapistId: t1, patientId: A }, "treatment_session", id),
    ).toHaveLength(1);
    // wrong therapist -> nothing
    expect(
      await getFieldValuesFrom({ therapistId: t2, patientId: B }, "treatment_session", id),
    ).toEqual([]);
    // right therapist, WRONG patient -> nothing (WP-22 hardening)
    expect(
      await getFieldValuesFrom({ therapistId: t1, patientId: B }, "treatment_session", id),
    ).toEqual([]);
  });
});

describe("side-effects", () => {
  it("create writes a 'session' timeline event + emits a create audit event", async () => {
    audited.length = 0;
    const wid = await weightDefId(t1);
    const { id } = await createSession(
      tdb(t1),
      {
        patientId: A,
        date: "2026-08-03",
        treatmentTypes: ["נטורופתיה", "תזונה"],
        patientReport: "מרגישה טוב יותר",
        recommendations: "להמשיך שתייה",
      },
      [{ definitionId: wid, value: 70.5 }],
    );

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl).toHaveLength(1);
    expect(tl[0].type).toBe("session");
    expect(tl[0].refId).toBe(id);
    expect(
      audited.some(
        (e) => e.action === "create" && e.entity === "treatment_session" && e.entityId === id,
      ),
    ).toBe(true);

    const full = await getSession(tdb(t1), id);
    expect(full?.patientReport).toBe("מרגישה טוב יותר");
    expect(full?.treatmentTypes).toEqual(["נטורופתיה", "תזונה"]);
    expect(full?.fields.find((f) => f.key === "weight_kg")?.value).toBe(70.5);
  });

  it("update replaces field values without a new timeline event", async () => {
    const wid = await weightDefId(t1);
    const { id } = await createSession(tdb(t1), { patientId: A, date: "2026-08-04" }, [
      { definitionId: wid, value: 72 },
    ]);
    await updateSession(tdb(t1), id, { complaints: "כאב ראש" }, [{ definitionId: wid, value: 71 }]);

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl).toHaveLength(1); // still just the create event

    const full = await getSession(tdb(t1), id);
    expect(full?.complaints).toBe("כאב ראש");
    expect(full?.fields.find((f) => f.key === "weight_kg")?.value).toBe(71);
  });

  it("rejects an out-of-scope value against the field schema", async () => {
    const wid = await weightDefId(t1);
    await expect(
      createSession(tdb(t1), { patientId: A, date: "2026-08-05" }, [
        { definitionId: wid, value: 5 }, // below min 20
      ]),
    ).rejects.toThrow();
  });
});

describe("patient summary (WP-61)", () => {
  it("only shared summaries reach the patient, and never another patient's", async () => {
    await createSession(tdb(t1), { patientId: A, date: "2026-08-10" }); // no summary
    const shared = await createSession(tdb(t1), {
      patientId: A,
      date: "2026-08-11",
      therapistNotes: "פנימי — לא לשיתוף",
      patientSummary: "  שתי כוסות מים ביום, נתראה בעוד שבועיים.  ",
    });
    expect(shared.sharedSummary).toBe("שתי כוסות מים ביום, נתראה בעוד שבועיים.");
    await createSession(tdb(t2), {
      patientId: B,
      date: "2026-08-11",
      patientSummary: "סיכום של מטופל אחר",
    });

    const mine = await listSharedSummaries(pdb(t1, A));
    expect(mine).toHaveLength(1);
    expect(mine[0].summary).toBe("שתי כוסות מים ביום, נתראה בעוד שבועיים.");
    // the internal note never crosses to the patient surface
    expect(JSON.stringify(mine)).not.toContain("פנימי");
    // another therapist's patient sees only their own
    expect((await listSharedSummaries(pdb(t2, B)))[0].summary).toBe("סיכום של מטופל אחר");
  });

  it("re-shares only when the summary text actually changes", async () => {
    const { id } = await createSession(tdb(t1), { patientId: A, date: "2026-08-12" });
    const first = await updateSession(tdb(t1), id, { patientSummary: "סיכום ראשון" });
    expect(first.sharedSummary).toBe("סיכום ראשון");
    const again = await updateSession(tdb(t1), id, { patientSummary: "סיכום ראשון" });
    expect(again.sharedSummary).toBeNull();
    const edited = await updateSession(tdb(t1), id, { patientSummary: "סיכום מעודכן" });
    expect(edited.sharedSummary).toBe("סיכום מעודכן");
  });
});

describe("appointment linkage", () => {
  it("accepts an appointment for the same patient, rejects one for another", async () => {
    const start = new Date();
    const good = await createAppointment(tdb(t1), {
      patientId: A,
      startsAt: start,
      endsAt: new Date(start.getTime() + 36e5),
    });
    const other = await createAppointment(tdb(t2), {
      patientId: B,
      startsAt: start,
      endsAt: new Date(start.getTime() + 36e5),
    });

    const { id } = await createSession(tdb(t1), {
      patientId: A,
      date: "2026-08-06",
      appointmentId: good.id,
    });
    expect((await getSession(tdb(t1), id))?.appointmentId).toBe(good.id);

    await expect(
      createSession(tdb(t1), { patientId: A, date: "2026-08-07", appointmentId: other.id }),
    ).rejects.toThrow("appointment_not_found");
  });
});
