import "server-only";
import { getDb } from "@/modules/core/data/client";
import { requireTherapist, requirePatient, getCurrentSession } from "@/modules/core/auth/server";
import { scopedDbFor } from "./index";
import type { PatientDb, TherapistDb, ScopedDb } from "./internal/scoped-db";

/**
 * Request-scoped entry points. A route / RSC loader / server action calls one of
 * these to get its DB handle — there is no other sanctioned path to the database
 * from app or domain code.
 */

export async function getTherapistDb(): Promise<TherapistDb> {
  const session = await requireTherapist(); // redirects if not a therapist
  return scopedDbFor(getDb(), session) as TherapistDb;
}

export async function getPatientDb(): Promise<PatientDb> {
  const session = await requirePatient(); // redirects if not a patient
  return scopedDbFor(getDb(), session) as PatientDb;
}

/** For places that handle both roles (e.g. a shared messaging view). Null when signed out. */
export async function getScopedDb(): Promise<ScopedDb | null> {
  const session = await getCurrentSession();
  return session ? scopedDbFor(getDb(), session) : null;
}
