import { and, eq, gt, lt, ne } from "drizzle-orm";
import type { Db } from "@/modules/core/data/client";
import {
  availabilityRule,
  availabilityException,
  bookingPolicy,
} from "@/modules/availability/schema";
import { appointment } from "@/modules/appointments/schema";

/**
 * Read-only scheduling surface for one therapist, used by the patient
 * self-booking flow (WP-29). It deliberately sits in core/authz because a
 * `PatientDb` cannot name a therapist-scoped table, yet the booking screen must
 * see the therapist's availability config and which times are already taken.
 *
 * It exposes ONLY:
 *  - the therapist's availability rules / blocked dates / booking policy;
 *  - OPAQUE busy ranges — `{ start, end }` of non-cancelled appointments, with
 *    no patient id, notes or treatment type.
 *
 * `therapistId` always comes from the caller's verified session, never from
 * user input, so a patient can only ever inspect their own therapist's diary,
 * and only as free/busy. See ADR-040.
 */
export class SchedulingView {
  constructor(
    private readonly _db: Db,
    readonly therapistId: string,
  ) {}

  async config(): Promise<{
    policy: typeof bookingPolicy.$inferSelect | null;
    rules: (typeof availabilityRule.$inferSelect)[];
    blockedDates: string[];
  }> {
    const [policyRows, rules, exceptions] = await Promise.all([
      this._db
        .select()
        .from(bookingPolicy)
        .where(eq(bookingPolicy.therapistId, this.therapistId))
        .limit(1),
      this._db
        .select()
        .from(availabilityRule)
        .where(eq(availabilityRule.therapistId, this.therapistId)),
      this._db
        .select({ date: availabilityException.date })
        .from(availabilityException)
        .where(eq(availabilityException.therapistId, this.therapistId)),
    ]);
    return {
      policy: policyRows[0] ?? null,
      rules,
      blockedDates: exceptions.map((e) => e.date),
    };
  }

  /** Non-cancelled appointments overlapping `[from, to)` — start/end only. */
  async busyRanges(from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
    const rows = await this._db
      .select({ start: appointment.startsAt, end: appointment.endsAt })
      .from(appointment)
      .where(
        and(
          eq(appointment.therapistId, this.therapistId),
          ne(appointment.status, "cancelled"),
          lt(appointment.startsAt, to),
          gt(appointment.endsAt, from),
        ),
      );
    return rows.map((r) => ({ start: r.start, end: r.end }));
  }
}
