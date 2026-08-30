// @vitest-environment node
/**
 * Isolation for the Patients module (WP-10). A therapist can only see and touch
 * their own patients; every mutation is auto-audited and writes a timeline event.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type ScopedAuditEvent, type TherapistDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  setPatientStatus,
} from "@/modules/patients";

let db: Db;
let t1: string;
let t2: string;
let audited: ScopedAuditEvent[];

function tdbFor(therapistId: string): TherapistDb {
  return scopedDbFor(
    db,
    { userId: "u", role: "therapist", therapistId, patientId: null, expiresAt: new Date() },
    (evt) => audited.push(evt),
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
});

describe("cross-therapist isolation", () => {
  it("listPatients + getPatient never cross the tenant line", async () => {
    const A = await createPatient(tdbFor(t1), { firstName: "מיכל", lastName: "אברהם" });
    const B = await createPatient(tdbFor(t2), { firstName: "רותם", lastName: "לוי" });

    const t1List = await listPatients(tdbFor(t1));
    expect(t1List.map((p) => p.id)).toEqual([A.id]);

    expect(await getPatient(tdbFor(t1), B.id)).toBeNull();
    expect((await getPatient(tdbFor(t1), A.id))?.firstName).toBe("מיכל");
  });

  it("updatePatient / setPatientStatus refuse another therapist's patient", async () => {
    const B = await createPatient(tdbFor(t2), { firstName: "ד", lastName: "פ" });
    await expect(
      updatePatient(tdbFor(t1), B.id, { firstName: "פרוץ", lastName: "פ" }),
    ).rejects.toThrow("patient_not_found");
    await expect(setPatientStatus(tdbFor(t1), B.id, "inactive")).rejects.toThrow(
      "patient_not_found",
    );

    const still = await getPatient(tdbFor(t2), B.id);
    expect(still?.firstName).toBe("ד");
  });
});

describe("create / update side-effects", () => {
  it("createPatient writes a timeline event + emits a create audit event", async () => {
    audited.length = 0;
    const { id } = await createPatient(tdbFor(t1), {
      firstName: "נועה",
      lastName: "שרון",
      treatmentTypes: ["naturopathy", "nutrition"],
      consents: ["data_processing", "data_transfer_abroad"],
    });

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, id));
    expect(tl).toHaveLength(1);
    expect(tl[0].type).toBe("status_changed");

    expect(
      audited.some((e) => e.action === "create" && e.entity === "patient" && e.entityId === id),
    ).toBe(true);
    expect(audited.some((e) => e.entity === "timeline_event" && e.action === "create")).toBe(true);

    const full = await getPatient(tdbFor(t1), id);
    expect(full?.treatmentTypes.sort()).toEqual(["naturopathy", "nutrition"]);
    expect(full?.consents.sort()).toEqual(["data_processing", "data_transfer_abroad"]);
  });

  it("a status change records a status_changed timeline event", async () => {
    const { id } = await createPatient(tdbFor(t1), { firstName: "a", lastName: "b" });
    await setPatientStatus(tdbFor(t1), id, "paused");
    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, id));
    expect(tl.filter((e) => e.type === "status_changed")).toHaveLength(2); // created + paused
    expect(tl.some((e) => e.summary.includes("מושהה"))).toBe(true);
  });
});

describe("search + filters", () => {
  beforeEach(async () => {
    const t = tdbFor(t1);
    await createPatient(t, {
      firstName: "מיכל",
      lastName: "אברהם",
      phone: "054-1112222",
      status: "active",
      treatmentTypes: ["naturopathy"],
    });
    await createPatient(t, {
      firstName: "רותם",
      lastName: "לוי",
      email: "rotem@ex.co",
      status: "paused",
      treatmentTypes: ["reflexology"],
    });
    await createPatient(t, {
      firstName: "שירה",
      lastName: "כהן",
      status: "active",
      treatmentTypes: ["nutrition"],
    });
  });

  it("filters by search, status and treatment type", async () => {
    const t = tdbFor(t1);
    expect((await listPatients(t, { search: "אברהם" })).map((p) => p.firstName)).toEqual(["מיכל"]);
    expect((await listPatients(t, { search: "054-111" })).map((p) => p.firstName)).toEqual([
      "מיכל",
    ]);
    expect((await listPatients(t, { search: "rotem@ex" })).map((p) => p.firstName)).toEqual([
      "רותם",
    ]);
    expect((await listPatients(t, { status: "active" })).length).toBe(2);
    expect(
      (await listPatients(t, { treatmentType: "reflexology" })).map((p) => p.firstName),
    ).toEqual(["רותם"]);
    expect(
      (await listPatients(t, { status: "active", treatmentType: "nutrition" })).map(
        (p) => p.firstName,
      ),
    ).toEqual(["שירה"]);
  });
});
