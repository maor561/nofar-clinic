// @vitest-environment node
/**
 * Cross-tenant isolation suite — the executable definition of the critical
 * requirement (CLAUDE.md "כלל הזהב"). Proves the scoping guard on two tables:
 * `patient` and `timeline_event`. Every new patient-data endpoint adds cases here.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { PatientDb, TherapistDb, scopedDbFor } from "@/modules/core/authz";
import { therapist, user, session as sessionTable } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import { getMyProfile } from "@/modules/patients";

let db: Db;
let t1: string;
let t2: string;
let A: string; // patient A (under t1)
let B: string; // patient B (under t1)
let C: string; // patient C (under t2)

async function mkTherapist(name: string, email: string) {
  const [row] = await db.insert(therapist).values({ name, email }).returning({ id: therapist.id });
  return row.id;
}
async function mkPatient(therapistId: string, first: string) {
  const [p] = await db
    .insert(patient)
    .values({ therapistId, firstName: first, lastName: "בדיקה" })
    .returning({ id: patient.id });
  await db.insert(user).values({
    role: "patient",
    email: `${first}@ex.co`,
    status: "active",
    therapistId,
    patientId: p.id,
  });
  await db.insert(timelineEvent).values({
    therapistId,
    patientId: p.id,
    type: "message",
    summary: `event for ${first}`,
  });
  return p.id;
}

function patientSession(therapistId: string, patientId: string) {
  return {
    userId: "u",
    role: "patient" as const,
    therapistId,
    patientId,
    expiresAt: new Date(Date.now() + 1000),
  };
}
function therapistSession(therapistId: string) {
  return {
    userId: "u",
    role: "therapist" as const,
    therapistId,
    patientId: null,
    expiresAt: new Date(Date.now() + 1000),
  };
}

beforeEach(async () => {
  db = await createTestDb();
  t1 = await mkTherapist("נופר", "nofar@ex.co");
  t2 = await mkTherapist("אחר", "other@ex.co");
  A = await mkPatient(t1, "איי");
  B = await mkPatient(t1, "בי");
  C = await mkPatient(t2, "סי");
});

describe("scopedDbFor", () => {
  it("returns the right class per role", () => {
    expect(scopedDbFor(db, therapistSession(t1))).toBeInstanceOf(TherapistDb);
    expect(scopedDbFor(db, patientSession(t1, A))).toBeInstanceOf(PatientDb);
  });
  it("refuses a patient session with no patient_id", () => {
    expect(() => scopedDbFor(db, { ...patientSession(t1, A), patientId: null })).toThrow();
  });
});

describe("patient scope — reads see only own rows", () => {
  it("self() returns the patient's own root row and nothing else", async () => {
    const pdbA = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    expect((await pdbA.self())?.id).toBe(A);
    // a patient scope pointed at B (impossible via a real session) still only ever
    // yields B — never a cross-read
    const pdbB = scopedDbFor(db, patientSession(t1, B)) as PatientDb;
    expect((await pdbB.self())?.id).toBe(B);
  });

  it("timeline_event is filtered to the patient", async () => {
    const pdb = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    const rows = await pdb.findMany(timelineEvent);
    expect(rows).toHaveLength(1);
    expect(rows[0].patientId).toBe(A);
    expect(await pdb.count(timelineEvent)).toBe(1);
  });

  it("getMyProfile (WP-19) returns only the caller's own profile", async () => {
    const pdbA = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    expect((await getMyProfile(pdbA))?.id).toBe(A);
    const pdbC = scopedDbFor(db, patientSession(t2, C)) as PatientDb;
    expect((await getMyProfile(pdbC))?.id).toBe(C);
  });
});

describe("patient scope — writes cannot cross the boundary", () => {
  it("update targeting another patient's event affects 0 rows", async () => {
    const bEvent = (await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, B)))[0];
    const pdb = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    const changed = await pdb.update(
      timelineEvent,
      { summary: "פרוץ" },
      eq(timelineEvent.id, bEvent.id),
    );
    expect(changed).toHaveLength(0);
    const still = await db.select().from(timelineEvent).where(eq(timelineEvent.id, bEvent.id));
    expect(still[0].summary).toBe("event for בי");
  });

  it("delete targeting another patient's event affects 0 rows", async () => {
    const bEvent = (await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, B)))[0];
    const pdb = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    const deleted = await pdb.delete(timelineEvent, eq(timelineEvent.id, bEvent.id));
    expect(deleted).toHaveLength(0);
    const still = await db.select().from(timelineEvent).where(eq(timelineEvent.id, bEvent.id));
    expect(still).toHaveLength(1);
  });

  it("insert forces the scope's patient_id / therapist_id, ignoring supplied values", async () => {
    const pdb = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    // a caller smuggling in another tenant's ids still cannot escape the scope
    const [row] = await pdb.insert(timelineEvent, {
      patientId: B,
      therapistId: t2,
      type: "message",
      summary: "smuggled",
    });
    expect(row.patientId).toBe(A);
    expect(row.therapistId).toBe(t1);
  });
});

describe("therapist scope", () => {
  it("sees own patients, not another therapist's", async () => {
    const tdb = scopedDbFor(db, therapistSession(t1)) as TherapistDb;
    const ids = (await tdb.findMany(patient)).map((r) => r.id).sort();
    expect(ids).toEqual([A, B].sort());
    expect(await tdb.findOne(patient, eq(patient.id, C))).toBeNull();
  });

  it("cannot update another therapist's patient", async () => {
    const tdb = scopedDbFor(db, therapistSession(t1)) as TherapistDb;
    const changed = await tdb.update(patient, { lastName: "x" }, eq(patient.id, C));
    expect(changed).toHaveLength(0);
  });
});

describe("no bypass surface", () => {
  it("exposes no accessor for a raw handle", () => {
    const pdb = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    const names = [
      ...Object.getOwnPropertyNames(pdb),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(pdb)),
      ...Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(pdb))),
    ];
    expect(names).not.toContain("getDb");
    expect(names).not.toContain("raw");
    expect(names).not.toContain("db");
  });

  it("a patient scope cannot even name a table without patient_id", () => {
    const pdb = scopedDbFor(db, patientSession(t1, A)) as PatientDb;
    // @ts-expect-error - `session` has no patientId column; must not typecheck.
    void (() => pdb.findMany(sessionTable));
  });
});
