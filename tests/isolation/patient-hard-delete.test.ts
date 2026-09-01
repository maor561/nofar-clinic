// @vitest-environment node
/**
 * WP-66 — hard, irreversible patient delete. Everything belonging to the patient
 * is gone: content rows, document blobs, the login and its sessions /
 * notifications / push subscriptions. Only the immutable metadata-only audit
 * trail survives. Nothing belonging to another therapist's patient is touched.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type ScopedAuditEvent, type TherapistDb } from "@/modules/core/authz";
import { therapist, user, session as authSession, invite } from "@/modules/core/auth/schema";
import { patient, patientTreatmentType } from "@/modules/patients/schema";
import { timelineEvent } from "@/modules/patient-file/schema";
import { treatmentSession } from "@/modules/sessions/schema";
import { document } from "@/modules/documents/schema";
import { fieldValue, fieldDefinition } from "@/modules/core/fields/schema";
import { notification } from "@/modules/core/notifications/schema";
import { pushSubscription } from "@/modules/core/push/schema";

const deleteFile = vi.fn().mockResolvedValue(undefined);
vi.mock("@/modules/core/files", () => ({
  deleteFile: (k: string) => deleteFile(k),
}));

import { deletePatientCompletely } from "@/modules/patients";

let db: Db;
let t1: string;
let t2: string;
let A: string; // t1's patient — deleted
let B: string; // t2's patient — must survive
let audited: ScopedAuditEvent[];

function tdb(therapistId: string): TherapistDb {
  return scopedDbFor(
    db,
    { userId: "u", role: "therapist", therapistId, patientId: null, expiresAt: new Date() },
    (e) => audited.push(e),
  ) as TherapistDb;
}

async function seedPatient(therapistId: string, name: string) {
  const [p] = await db
    .insert(patient)
    .values({ therapistId, firstName: name, lastName: "בדיקה" })
    .returning({ id: patient.id });
  const pid = p.id;

  const [u] = await db
    .insert(user)
    .values({
      email: `${name}@ex.co`,
      passwordHash: "x",
      role: "patient",
      therapistId,
      patientId: pid,
    })
    .returning({ id: user.id });
  await db.insert(authSession).values({
    id: `sess-${name}`,
    userId: u.id,
    expiresAt: new Date(Date.now() + 1e6),
  });
  await db.insert(notification).values({
    recipientUserId: u.id,
    therapistId,
    type: "generic",
    titleHe: "hi",
  });
  await db.insert(pushSubscription).values({
    userId: u.id,
    endpoint: `https://push/${name}`,
    p256dh: "k",
    auth: "a",
  });
  await db.insert(invite).values({
    patientId: pid,
    therapistId,
    email: `${name}@ex.co`,
    tokenHash: `inv-${name}`,
    expiresAt: new Date(Date.now() + 1e6),
  });

  await db.insert(document).values({
    therapistId,
    patientId: pid,
    name: "doc.pdf",
    fileKey: `p/${pid}/blob`,
    mime: "application/pdf",
    size: 10,
    uploadedBy: "therapist",
  });
  await db.insert(treatmentSession).values({ therapistId, patientId: pid, date: "2026-01-01" });
  await db
    .insert(timelineEvent)
    .values({ patientId: pid, therapistId, type: "session", summary: "s" });
  await db
    .insert(patientTreatmentType)
    .values({ patientId: pid, therapistId, treatmentType: "נטורופתיה" });

  const [fd] = await db
    .insert(fieldDefinition)
    .values({
      therapistId,
      entity: "treatment_session",
      key: `k-${name}`,
      labelHe: "מדד",
      type: "number",
      schema: { type: "number" },
    })
    .returning({ id: fieldDefinition.id });
  await db.insert(fieldValue).values({
    therapistId,
    patientId: pid,
    entity: "treatment_session",
    entityId: crypto.randomUUID(),
    definitionId: fd.id,
    value: 5,
  });

  return { pid, uid: u.id };
}

let uidA: string;

beforeEach(async () => {
  db = await createTestDb();
  audited = [];
  deleteFile.mockClear();
  [t1, t2] = (
    await db
      .insert(therapist)
      .values([
        { name: "נופר", email: "n@ex.co" },
        { name: "אחר", email: "o@ex.co" },
      ])
      .returning({ id: therapist.id })
  ).map((r) => r.id);
  ({ pid: A, uid: uidA } = await seedPatient(t1, "איי"));
  ({ pid: B } = await seedPatient(t2, "בי"));
});

describe("deletePatientCompletely", () => {
  it("removes the patient and every record + blob, keeps the other tenant intact", async () => {
    const res = await deletePatientCompletely(tdb(t1), A);
    expect(res.name).toBe("איי בדיקה");
    expect(res.blobsDeleted).toBe(1);
    expect(deleteFile).toHaveBeenCalledWith(`p/${A}/blob`);

    const gone = async (tbl: PgTable, where: SQL) =>
      expect(await db.select().from(tbl).where(where)).toHaveLength(0);

    await gone(patient, eq(patient.id, A));
    await gone(document, eq(document.patientId, A));
    await gone(treatmentSession, eq(treatmentSession.patientId, A));
    await gone(timelineEvent, eq(timelineEvent.patientId, A));
    await gone(patientTreatmentType, eq(patientTreatmentType.patientId, A));
    await gone(fieldValue, eq(fieldValue.patientId, A)); // FK cascade added in 0021
    await gone(invite, eq(invite.patientId, A)); // FK cascade added in 0021
    await gone(user, eq(user.patientId, A)); // FK cascade added in 0021
    await gone(authSession, eq(authSession.userId, uidA)); // user -> session cascade
    await gone(notification, eq(notification.recipientUserId, uidA));
    await gone(pushSubscription, eq(pushSubscription.userId, uidA));

    // t2's patient is completely untouched
    expect(await db.select().from(patient).where(eq(patient.id, B))).toHaveLength(1);
    expect(await db.select().from(document).where(eq(document.patientId, B))).toHaveLength(1);
    expect(await db.select().from(user).where(eq(user.patientId, B))).toHaveLength(1);
  });

  it("emits a delete audit event for the patient", async () => {
    audited.length = 0;
    await deletePatientCompletely(tdb(t1), A);
    expect(
      audited.some((e) => e.action === "delete" && e.entity === "patient" && e.entityId === A),
    ).toBe(true);
  });

  it("a therapist cannot hard-delete another therapist's patient", async () => {
    await expect(deletePatientCompletely(tdb(t1), B)).rejects.toThrow("patient_not_found");
    expect(await db.select().from(patient).where(eq(patient.id, B))).toHaveLength(1);
    expect(deleteFile).not.toHaveBeenCalled();
  });
});
