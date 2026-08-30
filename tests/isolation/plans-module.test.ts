// @vitest-environment node
/**
 * Isolation for the Treatment Plans module (WP-14). One active plan per patient;
 * every change is a NEW immutable version. Nothing crosses the tenant line, a
 * patient reads only their own current version, and a late edit never overwrites
 * an earlier version's content.
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
import { loadRegistryInto } from "@/modules/core/fields";
import {
  getPlan,
  listPlanVersions,
  getPlanVersion,
  savePlanVersion,
  planFieldDefs,
} from "@/modules/plans";

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

async function defId(therapistId: string, key: string): Promise<string> {
  const defs = await planFieldDefs(tdb(therapistId));
  return defs.find((d) => d.key === key)!.id;
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

describe("cross-tenant", () => {
  it("a therapist cannot see or write another therapist's plan", async () => {
    const nid = await defId(t2, "nutrition");
    await savePlanVersion(tdb(t2), {
      patientId: B,
      fields: [{ definitionId: nid, value: "של מטופל אחר" }],
    });

    expect(await getPlan(tdb(t1), B)).toBeNull();
    expect(await listPlanVersions(tdb(t1), B)).toEqual([]);
    await expect(savePlanVersion(tdb(t1), { patientId: B, fields: [] })).rejects.toThrow(
      "patient_not_found",
    );
  });

  it("a patient reads only their own current version", async () => {
    const nidA = await defId(t1, "nutrition");
    await savePlanVersion(tdb(t1), {
      patientId: A,
      fields: [{ definitionId: nidA, value: "לאכול ירקות" }],
    });

    const mine = await getPlan(pdb(t1, A), A);
    expect(mine?.current?.fields.find((f) => f.key === "nutrition")?.value).toBe("לאכול ירקות");
    // a patient scope pointed at another patient sees nothing
    expect(await getPlan(pdb(t1, A), B)).toBeNull();
  });
});

describe("append-only versions", () => {
  it("each save is a new version; earlier content is preserved", async () => {
    const nid = await defId(t1, "nutrition");
    const gid = await defId(t1, "goals");

    const v1 = await savePlanVersion(tdb(t1), {
      patientId: A,
      note: "התחלה",
      fields: [
        { definitionId: nid, value: "מרק ירקות יומי" },
        { definitionId: gid, value: "ירידה של 2 ק״ג" },
      ],
    });
    const v2 = await savePlanVersion(tdb(t1), {
      patientId: A,
      note: "הוספת תוספים",
      fields: [
        { definitionId: nid, value: "מרק ירקות + חלבון" },
        { definitionId: gid, value: "ירידה של 2 ק״ג" },
      ],
    });

    expect(v1.versionNo).toBe(1);
    expect(v2.versionNo).toBe(2);

    const view = await getPlan(tdb(t1), A);
    expect(view?.versionCount).toBe(2);
    expect(view?.plan.currentVersionId).toBe(v2.versionId);
    expect(view?.current?.versionNo).toBe(2);
    expect(view?.current?.fields.find((f) => f.key === "nutrition")?.value).toBe(
      "מרק ירקות + חלבון",
    );

    // v1 is untouched
    const old = await getPlanVersion(tdb(t1), v1.versionId);
    expect(old?.fields.find((f) => f.key === "nutrition")?.value).toBe("מרק ירקות יומי");

    const history = await listPlanVersions(tdb(t1), A);
    expect(history.map((h) => h.versionNo)).toEqual([2, 1]);
  });

  it("every save drops a plan_changed timeline event", async () => {
    const nid = await defId(t1, "nutrition");
    await savePlanVersion(tdb(t1), { patientId: A, fields: [{ definitionId: nid, value: "א" }] });
    await savePlanVersion(tdb(t1), { patientId: A, fields: [{ definitionId: nid, value: "ב" }] });

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl.filter((e) => e.type === "plan_changed")).toHaveLength(2);
    expect(tl.some((e) => e.summary.includes("נוצרה"))).toBe(true);
    expect(tl.some((e) => e.summary.includes("גרסה 2"))).toBe(true);
  });

  it("rejects a value that violates the field schema", async () => {
    const nid = await defId(t1, "nutrition");
    await expect(
      savePlanVersion(tdb(t1), {
        patientId: A,
        fields: [{ definitionId: nid, value: 123 }], // number into a text field
      }),
    ).rejects.toThrow();
  });

  it("an empty field is skipped (no NOT NULL crash) and clears a prior value", async () => {
    const nid = await defId(t1, "nutrition");
    const gid = await defId(t1, "goals");

    // v1: only nutrition filled, goals blank -> one row written, no crash
    const v1 = await savePlanVersion(tdb(t1), {
      patientId: A,
      fields: [
        { definitionId: nid, value: "מרק" },
        { definitionId: gid, value: null },
      ],
    });
    let cur = await getPlanVersion(tdb(t1), v1.versionId);
    expect(cur?.fields.map((f) => f.key)).toEqual(["nutrition"]);

    // v2: clear nutrition too -> version row exists, zero field rows
    const v2 = await savePlanVersion(tdb(t1), {
      patientId: A,
      fields: [
        { definitionId: nid, value: "" },
        { definitionId: gid, value: null },
      ],
    });
    cur = await getPlanVersion(tdb(t1), v2.versionId);
    expect(cur?.fields).toEqual([]);
    // v1 still intact
    const old = await getPlanVersion(tdb(t1), v1.versionId);
    expect(old?.fields.find((f) => f.key === "nutrition")?.value).toBe("מרק");
  });
});
