// @vitest-environment node
import { beforeEach, describe, expect, it } from "vitest";
import { TOTP, Secret } from "otpauth";
import { eq } from "drizzle-orm";
import { createTestDb } from "@/modules/core/data/testing";
import type { Db } from "@/modules/core/data/client";
import { patient } from "@/modules/patients/schema";
import { invite, loginAttempt, session, user } from "./schema";

import { registerTherapist, getUserByEmail } from "./internal/register";
import { getDisplayName } from "./internal/profile";
import { authenticate } from "./internal/authenticate";
import { passwordSchema } from "./internal/password";
import {
  createSession,
  readSession,
  revokeSession,
  SESSION_ROTATE_AFTER_MS,
} from "./internal/sessions";
import { hashToken } from "./internal/tokens";
import { createPatientInvite, peekInvite, acceptInvite } from "./internal/invites";
import { startPasswordReset, completePasswordReset } from "./internal/reset";
import { beginTotpEnrollment, confirmTotpEnrollment } from "./internal/totp";
import { MAX_FAILED_ATTEMPTS, IP_MAX_FAILURES } from "./internal/lockout";

const PW = "correct-horse-9";
const NEW_PW = "brand-new-42";

let db: Db;
let therapistId: string;

async function seedTherapist() {
  const r = await registerTherapist(db, {
    name: "נופר",
    email: "nofar@example.co.il",
    password: PW,
  });
  return r.therapistId;
}

async function seedPatient(email = "michal@example.co.il", first = "מיכל", last = "אברהם") {
  const [p] = await db
    .insert(patient)
    .values({ therapistId, firstName: first, lastName: last })
    .returning({ id: patient.id });
  const [u] = await db
    .insert(user)
    .values({ role: "patient", email, status: "invited", therapistId, patientId: p.id })
    .returning({ id: user.id });
  return { userId: u.id, patientId: p.id };
}

beforeEach(async () => {
  db = await createTestDb();
  therapistId = await seedTherapist();
});

describe("registration", () => {
  it("creates therapist + user, refuses a second therapist", async () => {
    const u = await getUserByEmail(db, "NOFAR@example.co.il");
    expect(u?.role).toBe("therapist");
    expect(u?.status).toBe("active");
    await expect(
      registerTherapist(db, { name: "x", email: "y@z.co", password: PW }),
    ).rejects.toThrow("therapist_already_exists");
  });
});

describe("authenticate", () => {
  it("accepts the right password", async () => {
    const r = await authenticate(db, { email: "nofar@example.co.il", password: PW });
    expect(r).toMatchObject({ status: "ok", role: "therapist" });
  });

  it("rejects a wrong password and counts the failure", async () => {
    const r = await authenticate(db, { email: "nofar@example.co.il", password: "nope" });
    expect(r.status).toBe("invalid");
    const u = await getUserByEmail(db, "nofar@example.co.il");
    expect(u?.failedAttempts).toBe(1);
  });

  it("is uniform for an unknown account", async () => {
    const r = await authenticate(db, { email: "ghost@example.co.il", password: "whatever-1" });
    expect(r.status).toBe("invalid");
  });

  it("locks the account after too many failures", async () => {
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) {
      await authenticate(db, { email: "nofar@example.co.il", password: "wrong" });
    }
    const r = await authenticate(db, { email: "nofar@example.co.il", password: PW });
    expect(r.status).toBe("locked");
  });

  it("throttles by IP", async () => {
    const rows = Array.from({ length: IP_MAX_FAILURES }, () => ({
      email: "a@b.co",
      ip: "10.0.0.9",
      success: false,
    }));
    await db.insert(loginAttempt).values(rows);
    const r = await authenticate(
      db,
      { email: "nofar@example.co.il", password: PW },
      { ip: "10.0.0.9" },
    );
    expect(r.status).toBe("throttled");
  });
});

describe("TOTP", () => {
  it("requires a valid code once enabled", async () => {
    const u = await getUserByEmail(db, "nofar@example.co.il");
    const { secret } = await beginTotpEnrollment(db, u!.id, u!.email);
    const totp = new TOTP({ secret: Secret.fromBase32(secret) });
    expect(await confirmTotpEnrollment(db, u!.id, u!.email, secret, totp.generate())).toBe(true);

    const noCode = await authenticate(db, { email: u!.email, password: PW });
    expect(noCode.status).toBe("totp_required");

    const badCode = await authenticate(db, { email: u!.email, password: PW, totpCode: "000000" });
    expect(badCode.status).toBe("invalid");

    const ok = await authenticate(db, {
      email: u!.email,
      password: PW,
      totpCode: totp.generate(),
    });
    expect(ok.status).toBe("ok");
  });
});

describe("sessions", () => {
  it("round-trips and revokes", async () => {
    const u = await getUserByEmail(db, "nofar@example.co.il");
    const { token } = await createSession(db, u!.id, { ip: "1.2.3.4" });
    const read = await readSession(db, token);
    expect(read?.active.userId).toBe(u!.id);
    expect(read?.active.role).toBe("therapist");

    await revokeSession(db, token);
    expect(await readSession(db, token)).toBeNull();
  });

  it("treats an expired row as no session", async () => {
    const u = await getUserByEmail(db, "nofar@example.co.il");
    await db.insert(session).values({
      id: hashToken("expired-token"),
      userId: u!.id,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await readSession(db, "expired-token")).toBeNull();
  });

  it("rotates a stale session token", async () => {
    const u = await getUserByEmail(db, "nofar@example.co.il");
    const { token } = await createSession(db, u!.id);
    await db
      .update(session)
      .set({ lastSeenAt: new Date(Date.now() - SESSION_ROTATE_AFTER_MS - 1000) })
      .where(eq(session.id, hashToken(token)));

    const read = await readSession(db, token);
    expect(read?.renewedToken).toBeTruthy();
    expect(read?.renewedToken).not.toBe(token);
    // old token no longer resolves, new one does
    expect(await readSession(db, token)).toBeNull();
    expect((await readSession(db, read!.renewedToken!))?.active.userId).toBe(u!.id);
  });
});

describe("patient invite", () => {
  it("is single-use and sets the password", async () => {
    const { patientId } = await seedPatient();
    const { token } = await createPatientInvite(db, {
      therapistId,
      patientId,
      email: "michal@example.co.il",
    });

    const preview = await peekInvite(db, token);
    expect(preview?.email).toBe("michal@example.co.il");

    const { userId } = await acceptInvite(db, token, NEW_PW);
    const u = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    expect(u[0].status).toBe("active");
    expect(u[0].passwordHash).toBeTruthy();

    await expect(acceptInvite(db, token, NEW_PW)).rejects.toThrow("invite_invalid");
    expect(await peekInvite(db, token)).toBeNull();

    const login = await authenticate(db, { email: "michal@example.co.il", password: NEW_PW });
    expect(login.status).toBe("ok");
  });

  it("rejects an expired invite", async () => {
    const { patientId } = await seedPatient("late@example.co.il");
    await db.insert(invite).values({
      patientId,
      email: "late@example.co.il",
      tokenHash: hashToken("stale"),
      expiresAt: new Date(Date.now() - 1000),
      therapistId,
    });
    expect(await peekInvite(db, "stale")).toBeNull();
    await expect(acceptInvite(db, "stale", NEW_PW)).rejects.toThrow("invite_invalid");
  });
});

describe("password reset", () => {
  it("changes the password, is single-use, and kills existing sessions", async () => {
    const u = await getUserByEmail(db, "nofar@example.co.il");
    const { token: sessionToken } = await createSession(db, u!.id);

    const started = await startPasswordReset(db, "nofar@example.co.il", "9.9.9.9");
    expect(started?.token).toBeTruthy();

    await completePasswordReset(db, started!.token, NEW_PW);

    expect((await authenticate(db, { email: u!.email, password: PW })).status).toBe("invalid");
    expect((await authenticate(db, { email: u!.email, password: NEW_PW })).status).toBe("ok");
    expect(await readSession(db, sessionToken)).toBeNull();

    await expect(completePasswordReset(db, started!.token, "another-99")).rejects.toThrow(
      "reset_invalid",
    );
  });

  it("does not reveal whether an email exists", async () => {
    expect(await startPasswordReset(db, "nobody@example.co.il", null)).toBeNull();
  });
});

describe("display name", () => {
  it("resolves the therapist and patient names", async () => {
    const t = await getUserByEmail(db, "nofar@example.co.il");
    expect(
      await getDisplayName(db, {
        userId: t!.id,
        role: "therapist",
        therapistId,
        patientId: null,
        expiresAt: new Date(),
      }),
    ).toBe("נופר");

    const { userId, patientId } = await seedPatient("noa@example.co.il", "נועה", "שרון");
    expect(
      await getDisplayName(db, {
        userId,
        role: "patient",
        therapistId,
        patientId,
        expiresAt: new Date(),
      }),
    ).toBe("נועה שרון");
  });
});

describe("invite → session end to end", () => {
  it("a fresh patient can accept an invite and open a session", async () => {
    const { patientId } = await seedPatient("dana@example.co.il", "דנה", "פרץ");
    const { token } = await createPatientInvite(db, {
      therapistId,
      patientId,
      email: "dana@example.co.il",
    });
    const { userId } = await acceptInvite(db, token, NEW_PW);
    const { token: sessionToken } = await createSession(db, userId);
    const read = await readSession(db, sessionToken);
    expect(read?.active.role).toBe("patient");
    expect(read?.active.patientId).toBe(patientId);
  });
});

describe("password policy", () => {
  it("only enforces a 10-character minimum", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false); // < 10
    expect(passwordSchema.safeParse("1234567890").success).toBe(true); // digits-only ok
    expect(passwordSchema.safeParse("alllettersok").success).toBe(true); // letters-only ok
    expect(passwordSchema.safeParse("goodpassword1").success).toBe(true);
    expect(passwordSchema.safeParse("סיסמהתקינה12").success).toBe(true);
    expect(passwordSchema.safeParse("a".repeat(201)).success).toBe(false); // > 200
  });
});
