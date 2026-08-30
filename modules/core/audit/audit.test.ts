// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type TherapistDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import { auditLog } from "./schema";
import { recordAudit, queryAudit, purgeOldAudit } from "./internal/record";

let db: Db;
let t1: string;
let t2: string;

async function mkTherapist(email: string) {
  const [r] = await db
    .insert(therapist)
    .values({ name: "x", email })
    .returning({ id: therapist.id });
  return r.id;
}

beforeEach(async () => {
  db = await createTestDb();
  t1 = await mkTherapist("a@ex.co");
  t2 = await mkTherapist("b@ex.co");
});

describe("record + query", () => {
  it("round-trips and orders newest first", async () => {
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "login",
      entity: "user",
    });
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "create",
      entity: "patient",
      patientId: crypto.randomUUID(),
    });
    const rows = await queryAudit(db, t1);
    expect(rows).toHaveLength(2);
    expect(rows[0].action).toBe("create");
    expect(rows[1].action).toBe("login");
  });

  it("filters by action / patient / date", async () => {
    const pid = crypto.randomUUID();
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "view",
      entity: "patient",
      patientId: pid,
    });
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "update",
      entity: "patient",
      patientId: pid,
    });
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "view",
      entity: "patient",
      patientId: crypto.randomUUID(),
    });

    expect(await queryAudit(db, t1, { action: "view" })).toHaveLength(2);
    expect(await queryAudit(db, t1, { patientId: pid })).toHaveLength(2);
    expect(await queryAudit(db, t1, { action: "update", patientId: pid })).toHaveLength(1);
    expect(await queryAudit(db, t1, { from: new Date(Date.now() + 60_000) })).toHaveLength(0);
  });

  it("is scoped to the therapist", async () => {
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "login",
      entity: "user",
    });
    await recordAudit(db, {
      therapistId: t2,
      actorRole: "therapist",
      action: "login",
      entity: "user",
    });
    expect(await queryAudit(db, t1)).toHaveLength(1);
    expect(await queryAudit(db, t2)).toHaveLength(1);
  });
});

describe("append-only", () => {
  it("rejects UPDATE and DELETE via the DB trigger", async () => {
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "login",
      entity: "user",
    });

    await expect(db.update(auditLog).set({ action: "delete" })).rejects.toThrowError();
    await expect(db.delete(auditLog)).rejects.toThrowError();

    const err = await db.delete(auditLog).catch((e: unknown) => e);
    // the raise comes from our trigger function (P0001)
    expect(JSON.stringify(err)).toMatch(/audit_log_no_mutate|P0001/);

    expect(await queryAudit(db, t1)).toHaveLength(1); // row intact
  });

  it("the retention purge can still prune (disables the trigger in a txn)", async () => {
    await recordAudit(db, {
      therapistId: t1,
      actorRole: "therapist",
      action: "login",
      entity: "user",
    });
    expect(await queryAudit(db, t1)).toHaveLength(1);
    await purgeOldAudit(db, new Date(Date.now() + 1000)); // cutoff in the future -> prune all
    expect(await queryAudit(db, t1)).toHaveLength(0);
  });
});

describe("scoped-db auto-audit", () => {
  it("emits a create event on every scoped write", async () => {
    const sink = vi.fn();
    const tdb = scopedDbFor(
      db,
      { userId: "u", role: "therapist", therapistId: t1, patientId: null, expiresAt: new Date() },
      sink,
    ) as TherapistDb;

    const [p] = await tdb.insert(patient, { firstName: "מ", lastName: "א" });
    expect(sink).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", entity: "patient", patientId: p.id }),
    );

    await tdb.update(patient, { lastName: "ב" }, eq(patient.id, p.id));
    expect(sink).toHaveBeenLastCalledWith(
      expect.objectContaining({ action: "update", entity: "patient" }),
    );
  });

  it("wired to recordAudit, a scoped write lands in audit_log", async () => {
    const session = {
      userId: crypto.randomUUID(),
      role: "therapist" as const,
      therapistId: t1,
      patientId: null,
      expiresAt: new Date(),
    };
    const tdb = scopedDbFor(db, session, (evt) => {
      void recordAudit(db, {
        therapistId: session.therapistId,
        actorUserId: session.userId,
        actorRole: "therapist",
        action: evt.action,
        entity: evt.entity,
        entityId: evt.entityId,
        patientId: evt.patientId,
      });
    }) as TherapistDb;
    const [p] = await tdb.insert(patient, { firstName: "ד", lastName: "פ" });
    await tdb.insert(timelineEvent, {
      patientId: p.id,
      type: "message",
      summary: "hi",
      occurredAt: new Date(),
    });

    const rows = await queryAudit(db, t1);
    expect(rows.map((r) => `${r.action}:${r.entity}`).sort()).toEqual([
      "create:patient",
      "create:timeline_event",
    ]);
    expect(rows.find((r) => r.entity === "patient")?.patientId).toBe(p.id);
  });
});
