import "../load-env";
import { getDb } from "../client";
import { therapist } from "@/modules/core/auth/schema";
import { loadRegistryInto } from "@/modules/core/fields";

/** One-off: (re)load FIELD_REGISTRY for every therapist. Run after registry changes. */
async function main() {
  const db = getDb();
  const ts = await db.select({ id: therapist.id }).from(therapist);
  for (const t of ts) {
    await loadRegistryInto(db, t.id);
    console.log("registry loaded for therapist", t.id);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
