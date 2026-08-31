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

import {
  listDocuments,
  getDocument,
  createDocument,
  setDocumentVisibility,
  deleteDocument,
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
