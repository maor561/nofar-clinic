import type { PatientDb } from "@/modules/core/authz";
import { listAppointmentRows } from "@/modules/appointments";
import { getActivePatientSeries } from "@/modules/patients";

/**
 * How many more appointments the patient may book themselves (WP-58):
 * the series quota minus the sessions already done minus the ones already
 * scheduled ahead. `null` when there is no active series (no limit).
 */
export async function seriesBookableLeft(
  pdb: PatientDb,
  patientId: string,
): Promise<number | null> {
  const series = await getActivePatientSeries(pdb, patientId);
  if (!series) return null;
  const futureScheduled = await listAppointmentRows(pdb, {
    from: new Date(),
    status: "scheduled",
    limit: 200,
  });
  return Math.max(0, series.sessionCount - series.usedCount - futureScheduled.length);
}
