import "../load-env";
import { getDb } from "../client";
import { therapist } from "@/modules/core/auth/schema";
import { patient } from "@/modules/patients/schema";
import { provisionPatientUser, createPatientInvite } from "@/modules/core/auth";

async function main() {
  const db = getDb();
  const [t] = await db.select({ id: therapist.id }).from(therapist).limit(1);
  const email = `test-${Date.now()}@example.co.il`;
  const [p] = await db
    .insert(patient)
    .values({ therapistId: t.id, firstName: "בדיקה", lastName: "התראה" })
    .returning({ id: patient.id });
  await provisionPatientUser({ therapistId: t.id, patientId: p.id, email });
  const { token } = await createPatientInvite({ therapistId: t.id, patientId: p.id, email });
  console.log("INVITE_URL=/invite/" + token);
  console.log("email=" + email);
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
