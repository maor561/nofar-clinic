import { and, eq, sql, type InferSelectModel, type SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import type { Db } from "@/modules/core/data/client";
import { patient } from "@/modules/patients/schema";

/**
 * The scoping guard's runtime half.
 *
 * A `ScopedDb` is bound to one tenant scope and exposes ONLY scoped operations —
 * every read/write is AND-ed with `therapist_id = <scope>` (and, for a patient
 * scope, `patient_id = <scope>`). It holds the raw Drizzle handle in a protected
 * field with no public accessor, so there is no in-bounds way to run an unscoped
 * query.
 *
 * Tables must carry the scope columns or they don't typecheck against these
 * methods — a patient scope cannot even name a therapist-only table. The one
 * exception is the `patient` root row itself, reached via `PatientDb.self()`.
 *
 * `values` on writes is intentionally loose (`Record<string, unknown>`): domain
 * modules wrap these primitives in their own typed service functions, and the
 * guard overrides the scope columns regardless of what the caller passes.
 */

export type TherapistScopedTable = PgTable & { therapistId: PgColumn };
export type PatientScopedTable = PgTable & { therapistId: PgColumn; patientId: PgColumn };

type Rows = Record<string, unknown>[];
type Values = Record<string, unknown> | readonly Record<string, unknown>[];

// drizzle's generic query builder resists precise typing across arbitrary
// tables; the `any` casts are internal, the public signatures stay type-safe.
/* eslint-disable @typescript-eslint/no-explicit-any */

abstract class BaseScopedDb {
  protected constructor(protected readonly _db: Db) {}
}

export class TherapistDb extends BaseScopedDb {
  readonly role = "therapist" as const;
  constructor(
    db: Db,
    readonly therapistId: string,
  ) {
    super(db);
  }

  scopeWhere<T extends TherapistScopedTable>(table: T, extra?: SQL): SQL {
    const base = eq(table.therapistId, this.therapistId);
    return extra ? and(base, extra)! : base;
  }

  async findMany<T extends TherapistScopedTable>(
    table: T,
    extra?: SQL,
  ): Promise<InferSelectModel<T>[]> {
    return (await (this._db as any)
      .select()
      .from(table)
      .where(this.scopeWhere(table, extra))) as InferSelectModel<T>[];
  }

  async findOne<T extends TherapistScopedTable>(
    table: T,
    extra?: SQL,
  ): Promise<InferSelectModel<T> | null> {
    return (await this.findMany(table, extra))[0] ?? null;
  }

  async count<T extends TherapistScopedTable>(table: T, extra?: SQL): Promise<number> {
    const rows = (await (this._db as any)
      .select({ n: sql<number>`count(*)::int` })
      .from(table)
      .where(this.scopeWhere(table, extra))) as { n: number }[];
    return rows[0]?.n ?? 0;
  }

  async insert<T extends TherapistScopedTable>(
    table: T,
    values: Values,
  ): Promise<InferSelectModel<T>[]> {
    const list = Array.isArray(values) ? values : [values];
    const scoped = list.map((v) => ({ ...v, therapistId: this.therapistId }));
    return (await (this._db as any)
      .insert(table)
      .values(scoped)
      .returning()) as InferSelectModel<T>[];
  }

  async update<T extends TherapistScopedTable>(
    table: T,
    set: Record<string, unknown>,
    extra?: SQL,
  ): Promise<InferSelectModel<T>[]> {
    return (await (this._db as any)
      .update(table)
      .set(set)
      .where(this.scopeWhere(table, extra))
      .returning()) as InferSelectModel<T>[];
  }

  async delete<T extends TherapistScopedTable>(table: T, extra?: SQL): Promise<Rows> {
    return (await (this._db as any)
      .delete(table)
      .where(this.scopeWhere(table, extra))
      .returning()) as Rows;
  }
}

export class PatientDb extends BaseScopedDb {
  readonly role = "patient" as const;
  constructor(
    db: Db,
    readonly therapistId: string,
    readonly patientId: string,
  ) {
    super(db);
  }

  scopeWhere<T extends PatientScopedTable>(table: T, extra?: SQL): SQL {
    const base = and(eq(table.therapistId, this.therapistId), eq(table.patientId, this.patientId))!;
    return extra ? and(base, extra)! : base;
  }

  /** The patient's own root row (scoped by therapist_id + id). */
  async self(): Promise<InferSelectModel<typeof patient> | null> {
    const rows = await this._db
      .select()
      .from(patient)
      .where(and(eq(patient.therapistId, this.therapistId), eq(patient.id, this.patientId)))
      .limit(1);
    return rows[0] ?? null;
  }

  async findMany<T extends PatientScopedTable>(
    table: T,
    extra?: SQL,
  ): Promise<InferSelectModel<T>[]> {
    return (await (this._db as any)
      .select()
      .from(table)
      .where(this.scopeWhere(table, extra))) as InferSelectModel<T>[];
  }

  async findOne<T extends PatientScopedTable>(
    table: T,
    extra?: SQL,
  ): Promise<InferSelectModel<T> | null> {
    return (await this.findMany(table, extra))[0] ?? null;
  }

  async count<T extends PatientScopedTable>(table: T, extra?: SQL): Promise<number> {
    const rows = (await (this._db as any)
      .select({ n: sql<number>`count(*)::int` })
      .from(table)
      .where(this.scopeWhere(table, extra))) as { n: number }[];
    return rows[0]?.n ?? 0;
  }

  async insert<T extends PatientScopedTable>(
    table: T,
    values: Values,
  ): Promise<InferSelectModel<T>[]> {
    const list = Array.isArray(values) ? values : [values];
    const scoped = list.map((v) => ({
      ...v,
      therapistId: this.therapistId,
      patientId: this.patientId,
    }));
    return (await (this._db as any)
      .insert(table)
      .values(scoped)
      .returning()) as InferSelectModel<T>[];
  }

  async update<T extends PatientScopedTable>(
    table: T,
    set: Record<string, unknown>,
    extra?: SQL,
  ): Promise<InferSelectModel<T>[]> {
    return (await (this._db as any)
      .update(table)
      .set(set)
      .where(this.scopeWhere(table, extra))
      .returning()) as InferSelectModel<T>[];
  }

  async delete<T extends PatientScopedTable>(table: T, extra?: SQL): Promise<Rows> {
    return (await (this._db as any)
      .delete(table)
      .where(this.scopeWhere(table, extra))
      .returning()) as Rows;
  }
}

export type ScopedDb = TherapistDb | PatientDb;
