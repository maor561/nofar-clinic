// @vitest-environment node
/**
 * Isolation for the Documents module (WP-17). A `therapist_only` document must
 * be unreachable for a patient on every path; nothing crosses the tenant line.
 * The blob layer is mocked — this suite is about the metadata + scoping.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
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

vi.mock("@/modules/core/files", () => ({
  deleteFile: vi.fn().mockResolvedValue(undefined),
}));

import { document } from "@/modules/documents/schema";
import {
  listDocuments,
  listRecentDocuments,
  getDocument,
  createDocument,
  setDocumentVisibility,
  deleteDocument,
  shareDocumentWithPatients,
  listRetentionReview,
  countRetentionReview,
  deferRetention,
} from "@/modules/documents";

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

const base = (patientId: string, over: Partial<Parameters<typeof createDocument>[1]> = {}) => ({
  patientId,
  name: "בדיקת דם.pdf",
  kind: "lab_result" as const,
  fileKey: `p/${patientId}/${Math.random()}`,
  mime: "application/pdf",
  size: 1234,
  ...over,
});

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
  it("a therapist never sees / touches another therapist's documents", async () => {
    const { id } = await createDocument(tdb(t2), base(B));

    expect(await listDocuments(tdb(t1), B)).toEqual([]);
    expect(await getDocument(tdb(t1), id)).toBeNull();
    await deleteDocument(tdb(t1), id); // scoped delete: 0 rows, no throw
    expect(await getDocument(tdb(t2), id)).not.toBeNull();
  });

  it("a therapist cannot create a document for another therapist's patient (WP-22)", async () => {
    await expect(createDocument(tdb(t1), base(B))).rejects.toThrow("patient_not_found");
  });

  it("listRecentDocuments (WP-20 dashboard) is therapist-scoped", async () => {
    await createDocument(tdb(t1), base(A));
    await createDocument(tdb(t2), base(B));
    const forT1 = await listRecentDocuments(tdb(t1));
    expect(forT1).toHaveLength(1);
    expect(forT1[0].patientName).toBe("איי בדיקה");
  });
});

describe("visibility — a patient never reaches therapist_only", () => {
  it("list + get exclude therapist_only for a patient handle", async () => {
    const internal = await createDocument(tdb(t1), base(A, { visibility: "therapist_only" }));
    const shared = await createDocument(tdb(t1), base(A, { visibility: "therapist_and_patient" }));

    // therapist sees both
    expect((await listDocuments(tdb(t1), A)).map((d) => d.id).sort()).toEqual(
      [internal.id, shared.id].sort(),
    );

    // patient sees only the shared one — on both paths
    const patientList = await listDocuments(pdb(t1, A), A);
    expect(patientList.map((d) => d.id)).toEqual([shared.id]);
    expect(await getDocument(pdb(t1, A), internal.id)).toBeNull();
    expect((await getDocument(pdb(t1, A), shared.id))?.id).toBe(shared.id);
  });

  it("flipping visibility to therapist_only hides it from the patient again", async () => {
    const { id } = await createDocument(tdb(t1), base(A, { visibility: "therapist_and_patient" }));
    expect(await getDocument(pdb(t1, A), id)).not.toBeNull();

    await setDocumentVisibility(tdb(t1), id, "therapist_only");
    expect(await getDocument(pdb(t1, A), id)).toBeNull();
  });
});

describe("share to many patients (WP-63)", () => {
  let A2: string;
  beforeEach(async () => {
    [A2] = (
      await db
        .insert(patient)
        .values([{ therapistId: t1, firstName: "איי2", lastName: "בדיקה" }])
        .returning({ id: patient.id })
    ).map((r) => r.id);
  });

  it("creates one shared, independent row per patient + a timeline event each", async () => {
    const created = await shareDocumentWithPatients(
      tdb(t1),
      [A, A2],
      { name: "המלצות כלליות.pdf", kind: "summary", mime: "application/pdf", size: 999 },
      (pid) => `p/${pid}/copy-${pid}`,
    );
    expect(created).toHaveLength(2);

    for (const pid of [A, A2]) {
      const rows = await listDocuments(tdb(t1), pid);
      expect(rows).toHaveLength(1);
      expect(rows[0].visibility).toBe("therapist_and_patient");
      expect(rows[0].uploadedBy).toBe("therapist");
      // each patient sees its own copy
      expect(await listDocuments(pdb(t1, pid), pid)).toHaveLength(1);
      const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, pid));
      expect(tl.some((e) => e.type === "document_added")).toBe(true);
    }
    // distinct blob keys — a later per-patient delete can't affect the other
    const keyA = (await listDocuments(tdb(t1), A))[0].fileKey;
    const keyA2 = (await listDocuments(tdb(t1), A2))[0].fileKey;
    expect(keyA).not.toBe(keyA2);
  });

  it("aborts the whole batch if any patient isn't this therapist's", async () => {
    await expect(
      shareDocumentWithPatients(
        tdb(t1),
        [A, B],
        { name: "x.pdf", kind: "other", mime: "application/pdf", size: 1 },
        (pid) => `p/${pid}/k`,
      ),
    ).rejects.toThrow("patient_not_found");
    // nothing was written for the valid patient either
    expect(await listDocuments(tdb(t1), A)).toEqual([]);
  });
});

describe("retention review loop (WP-64)", () => {
  const DAY = 86_400_000;
  const age = (id: string, days: number) =>
    db
      .update(document)
      .set({ createdAt: new Date(Date.now() - days * DAY) })
      .where(eq(document.id, id));

  it("surfaces only documents older than a year, scoped to the therapist", async () => {
    const old = await createDocument(tdb(t1), base(A));
    const fresh = await createDocument(tdb(t1), base(A));
    const otherOld = await createDocument(tdb(t2), base(B));
    await age(old.id, 400);
    await age(otherOld.id, 400);

    const review = await listRetentionReview(tdb(t1));
    expect(review.map((d) => d.id)).toEqual([old.id]);
    expect(review[0].patientName).toBe("איי בדיקה");
    expect(await countRetentionReview(tdb(t1))).toBe(1);
    // fresh one is not there
    expect(review.some((d) => d.id === fresh.id)).toBe(false);
    // t2's old doc is on t2's list only
    expect((await listRetentionReview(tdb(t2))).map((d) => d.id)).toEqual([otherOld.id]);
  });

  it("'keep' defers the next review by 90 days, then it returns", async () => {
    const { id } = await createDocument(tdb(t1), base(A));
    await age(id, 400);
    await deferRetention(tdb(t1), id);
    expect(await countRetentionReview(tdb(t1))).toBe(0);

    // simulate 91 days passing: pull the defer date into the past
    await db
      .update(document)
      .set({ retentionDeferUntil: new Date(Date.now() - DAY) })
      .where(eq(document.id, id));
    expect(await countRetentionReview(tdb(t1))).toBe(1);
  });

  it("a therapist cannot defer another therapist's document", async () => {
    const { id } = await createDocument(tdb(t2), base(B));
    await age(id, 400);
    await expect(deferRetention(tdb(t1), id)).rejects.toThrow("document_not_found");
    // still up for review on t2's list, untouched
    expect(await countRetentionReview(tdb(t2))).toBe(1);
  });
});

describe("upload rules + side-effects", () => {
  it("a patient upload is forced to shared + uploadedBy patient", async () => {
    const { id } = await createDocument(pdb(t1, A), base(A, { visibility: "therapist_only" }));
    const row = await getDocument(tdb(t1), id);
    expect(row?.visibility).toBe("therapist_and_patient");
    expect(row?.uploadedBy).toBe("patient");
  });

  it("create writes a document_added timeline event + emits a create audit event", async () => {
    audited.length = 0;
    const { id } = await createDocument(tdb(t1), base(A));

    const tl = await db.select().from(timelineEvent).where(eq(timelineEvent.patientId, A));
    expect(tl).toHaveLength(1);
    expect(tl[0].type).toBe("document_added");
    expect(tl[0].refId).toBe(id);
    expect(
      audited.some((e) => e.action === "create" && e.entity === "document" && e.entityId === id),
    ).toBe(true);
  });
});
