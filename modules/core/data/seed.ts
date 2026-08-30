import "./load-env";
import { sql } from "drizzle-orm";
import { getDb } from "./client";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { registerTherapist, provisionPatientUser, createPatientInvite } from "@/modules/core/auth";
import { loadRegistryInto } from "@/modules/core/fields";

/**
 * Dev seed: one therapist (נופר) + two patients with pending invites.
 * Idempotent-ish — bails if a therapist already exists.
 */
export async function seed() {
  const db = getDb();
  const existing = await db.select({ n: sql<number>`count(*)::int` }).from(therapist);
  if ((existing[0]?.n ?? 0) > 0) {
    console.log("seed: therapist already exists, skipping");
    return;
  }

  const { therapistId } = await registerTherapist({
    name: "נופר כהן",
    email: "nofar@example.co.il",
    password: "nofar-dev-2026",
  });
  console.log("seed: therapist nofar@example.co.il / nofar-dev-2026");

  await loadRegistryInto(db, therapistId);
  console.log("seed: field registry loaded");

  for (const p of [
    { firstName: "מיכל", lastName: "אברהם", email: "michal@example.co.il" },
    { firstName: "רותם", lastName: "לוי", email: "rotem@example.co.il" },
  ]) {
    const [row] = await db
      .insert(patient)
      .values({ therapistId, firstName: p.firstName, lastName: p.lastName })
      .returning({ id: patient.id });
    await provisionPatientUser({ therapistId, patientId: row.id, email: p.email });
    const { token } = await createPatientInvite({ therapistId, patientId: row.id, email: p.email });
    console.log(`seed: patient ${p.email} — invite token ${token}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
