import { and, asc, desc, eq, isNull, ne, type InferSelectModel } from "drizzle-orm";
import type { TherapistDb, PatientDb } from "@/modules/core/authz";
import { patient } from "@/modules/patients/schema";
import { messageThread, message, type MessageSender } from "./schema";

export type { MessageSender } from "./schema";

type AnyScoped = TherapistDb | PatientDb;

export type MessageRow = InferSelectModel<typeof message>;
export type ThreadRow = InferSelectModel<typeof messageThread>;
export type ThreadSummary = ThreadRow & {
  patientName: string;
  lastBody: string | null;
  lastSender: MessageSender | null;
  unread: number;
};

/** Resolve (or create) the single thread for a patient. */
async function resolveThread(
  db: AnyScoped,
  patientId: string,
  create: boolean,
): Promise<ThreadRow | null> {
  const found = await (db as TherapistDb).findOne(
    messageThread,
    eq(messageThread.patientId, patientId),
  );
  if (found || !create) return found;
  const [row] = await (db as TherapistDb).insert(messageThread, { patientId });
  return row;
}

export async function listMessages(
  db: AnyScoped,
  patientId: string,
  opts: { limit?: number } = {},
): Promise<MessageRow[]> {
  const thread = await resolveThread(db, patientId, false);
  if (!thread) return [];
  return (db as TherapistDb).list(message, {
    where: eq(message.threadId, thread.id),
    orderBy: [asc(message.sentAt)],
    limit: Math.min(opts.limit ?? 500, 1000),
  });
}

export async function sendMessage(
  db: AnyScoped,
  patientId: string,
  body: string,
): Promise<{ id: string; threadId: string; sender: MessageSender }> {
  const text = body.trim();
  if (!text) throw new Error("empty_message");
  if (text.length > 5000) throw new Error("message_too_long");

  // a therapist may only open a thread for one of their own patients
  if (db.role === "therapist") {
    const p = await db.findOne(patient, eq(patient.id, patientId));
    if (!p) throw new Error("patient_not_found");
  }

  const thread = await resolveThread(db, patientId, true);
  if (!thread) throw new Error("thread_unavailable");

  const sender = db.role as MessageSender;
  const [row] = await (db as TherapistDb).insert(message, {
    threadId: thread.id,
    patientId,
    sender,
    body: text,
  });
  await (db as TherapistDb).update(
    messageThread,
    { lastMessageAt: new Date() },
    eq(messageThread.id, thread.id),
  );

  return { id: row.id, threadId: thread.id, sender };
}

/** Mark every message the OTHER party sent in this thread as read. */
export async function markThreadRead(db: AnyScoped, patientId: string): Promise<number> {
  const thread = await resolveThread(db, patientId, false);
  if (!thread) return 0;
  const rows = await (db as TherapistDb).update(
    message,
    { readAt: new Date() },
    and(
      eq(message.threadId, thread.id),
      ne(message.sender, db.role as MessageSender),
      isNull(message.readAt),
    ),
  );
  return rows.length;
}

/** Unread messages for the current handle's role (therapist: across all patients). */
export async function unreadCountFor(db: AnyScoped): Promise<number> {
  return (db as TherapistDb).count(
    message,
    and(ne(message.sender, db.role as MessageSender), isNull(message.readAt)),
  );
}

/** Therapist inbox — one row per patient conversation, newest first. */
export async function listThreads(tdb: TherapistDb): Promise<ThreadSummary[]> {
  const threads = await tdb.list(messageThread, { orderBy: [desc(messageThread.lastMessageAt)] });
  if (threads.length === 0) return [];

  const [people, msgs] = await Promise.all([tdb.findMany(patient), tdb.findMany(message)]);
  const nameById = new Map(people.map((p) => [p.id, `${p.firstName} ${p.lastName}`]));

  const byThread = new Map<string, MessageRow[]>();
  for (const m of msgs) {
    const list = byThread.get(m.threadId) ?? [];
    list.push(m);
    byThread.set(m.threadId, list);
  }

  return threads.map((t) => {
    const list = (byThread.get(t.id) ?? []).sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
    const last = list[list.length - 1] ?? null;
    return {
      ...t,
      patientName: nameById.get(t.patientId) ?? "מטופל/ת",
      lastBody: last?.body ?? null,
      lastSender: last?.sender ?? null,
      unread: list.filter((m) => m.sender === "patient" && m.readAt == null).length,
    };
  });
}
