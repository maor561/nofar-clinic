// @vitest-environment node
/**
 * Isolation for the Messaging module (WP-16). One thread per patient. Neither
 * scoped handle can read or write another tenant's conversation, and "mark read"
 * only ever touches the other party's messages.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { scopedDbFor, type TherapistDb, type PatientDb } from "@/modules/core/authz";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import {
  sendMessage,
  listMessages,
  markThreadRead,
  unreadCountFor,
  listThreads,
} from "@/modules/messaging";

let db: Db;
let t1: string;
let t2: string;
let A: string;
let B: string;

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
});

describe("cross-tenant", () => {
  it("a therapist cannot read or open another therapist's conversation", async () => {
    await sendMessage(tdb(t2), B, "שלום מטופל בי");

    expect(await listMessages(tdb(t1), B)).toEqual([]);
    expect(await listThreads(tdb(t1))).toEqual([]);
    await expect(sendMessage(tdb(t1), B, "פריצה")).rejects.toThrow("patient_not_found");

    // t2's conversation is untouched
    expect(await listMessages(tdb(t2), B)).toHaveLength(1);
  });

  it("a patient handle only ever sees its own thread", async () => {
    await sendMessage(tdb(t1), A, "היי איי");
    await sendMessage(tdb(t2), B, "היי בי");

    const mine = await listMessages(pdb(t1, A), A);
    expect(mine).toHaveLength(1);
    expect(mine[0].patientId).toBe(A);

    // pointed at someone else's id -> nothing (guard forces patient_id)
    expect(await listMessages(pdb(t1, A), B)).toEqual([]);
  });
});

describe("conversation flow", () => {
  it("both parties send into the same thread, newest last", async () => {
    await sendMessage(tdb(t1), A, "מה שלומך?");
    await sendMessage(pdb(t1, A), A, "מצוין, תודה");
    await sendMessage(tdb(t1), A, "נהדר לשמוע");

    const msgs = await listMessages(tdb(t1), A);
    expect(msgs.map((m) => m.sender)).toEqual(["therapist", "patient", "therapist"]);
    expect(msgs.map((m) => m.body)).toEqual(["מה שלומך?", "מצוין, תודה", "נהדר לשמוע"]);
    // one thread only
    expect(new Set(msgs.map((m) => m.threadId)).size).toBe(1);
  });

  it("unread + markThreadRead only touch the other party's messages", async () => {
    await sendMessage(tdb(t1), A, "הודעה 1 מהמטפלת");
    await sendMessage(tdb(t1), A, "הודעה 2 מהמטפלת");
    await sendMessage(pdb(t1, A), A, "תשובה מהמטופל");

    // patient has 2 unread (from therapist); therapist has 1 unread (from patient)
    expect(await unreadCountFor(pdb(t1, A))).toBe(2);
    expect(await unreadCountFor(tdb(t1))).toBe(1);

    const marked = await markThreadRead(pdb(t1, A), A);
    expect(marked).toBe(2);
    expect(await unreadCountFor(pdb(t1, A))).toBe(0);
    // the patient's own message is still unread for the therapist
    expect(await unreadCountFor(tdb(t1))).toBe(1);

    await markThreadRead(tdb(t1), A);
    expect(await unreadCountFor(tdb(t1))).toBe(0);
  });

  it("listThreads shows the last message + unread count per patient", async () => {
    await sendMessage(tdb(t1), A, "פתיחה");
    await sendMessage(pdb(t1, A), A, "היי, יש לי שאלה");

    const threads = await listThreads(tdb(t1));
    expect(threads).toHaveLength(1);
    expect(threads[0].patientName).toBe("איי בדיקה");
    expect(threads[0].lastBody).toBe("היי, יש לי שאלה");
    expect(threads[0].lastSender).toBe("patient");
    expect(threads[0].unread).toBe(1);
  });
});
