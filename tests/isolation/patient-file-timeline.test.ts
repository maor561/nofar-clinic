// @vitest-environment node
/**
 * Isolation for the Patient File timeline read side (WP-11). `listTimeline` /
 * `countTimeline` must never cross the tenant line, whichever scoped handle
 * calls them and whatever `patientId` is passed in.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type PatientDb, type TherapistDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { listTimeline, countTimeline, recordEvent } from "@/modules/patient-file";

let db: Db;
let t1: string;
let t2: string;
let A: string; // patient under t1
let B: string; // patient under t2

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

  const day = 864e5;
  await recordEvent(tdb(t1), {
    patientId: A,
    type: "status_changed",
    summary: "נוסף",
    occurredAt: new Date(Date.now() - 3 * day),
  });
  await recordEvent(tdb(t1), {
    patientId: A,
    type: "message",
    summary: "הודעה ראשונה",
    occurredAt: new Date(Date.now() - 1 * day),
  });
  await recordEvent(tdb(t1), {
    patientId: A,
    type: "appointment",
    summary: "פגישה נקבעה",
    occurredAt: new Date(),
  });
  await recordEvent(tdb(t2), { patientId: B, type: "message", summary: "של מטופל אחר" });
});

describe("cross-tenant", () => {
  it("a therapist cannot read another therapist's patient timeline", async () => {
    expect(await listTimeline(tdb(t1), B)).toEqual([]);
    expect(await countTimeline(tdb(t1), B)).toBe(0);
    // and t2 cannot see A
    expect(await listTimeline(tdb(t2), A)).toEqual([]);
  });

  it("a patient handle only ever yields its own timeline", async () => {
    const own = await listTimeline(pdb(t1, A), A);
    expect(own).toHaveLength(3);
    expect(own.every((e) => e.patientId === A)).toBe(true);
    // pointed at someone else's id → still nothing
    expect(await listTimeline(pdb(t1, A), B)).toEqual([]);
    expect(await countTimeline(pdb(t1, A), B)).toBe(0);
  });
});

describe("ordering + filters", () => {
  it("returns newest-first by default, oldest-first when asked", async () => {
    const desc = await listTimeline(tdb(t1), A);
    expect(desc.map((e) => e.type)).toEqual(["appointment", "message", "status_changed"]);
    const asc = await listTimeline(tdb(t1), A, { ascending: true });
    expect(asc.map((e) => e.type)).toEqual(["status_changed", "message", "appointment"]);
  });

  it("filters by event type", async () => {
    const msgs = await listTimeline(tdb(t1), A, { types: ["message"] });
    expect(msgs.map((e) => e.summary)).toEqual(["הודעה ראשונה"]);
    expect(await countTimeline(tdb(t1), A, { types: ["message", "appointment"] })).toBe(2);
  });

  it("filters by date window", async () => {
    const since = new Date(Date.now() - 2 * 864e5);
    const recent = await listTimeline(tdb(t1), A, { since });
    expect(recent.map((e) => e.type)).toEqual(["appointment", "message"]);
    expect(await countTimeline(tdb(t1), A, { since })).toBe(2);
  });

  it("caps the page size at 500", async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      patientId: A,
      type: "message" as const,
      summary: `m${i}`,
    }));
    for (const m of many) await recordEvent(tdb(t1), m);
    const page = await listTimeline(tdb(t1), A, { limit: 999, types: ["message"] });
    expect(page.length).toBe(13);
  });
});
