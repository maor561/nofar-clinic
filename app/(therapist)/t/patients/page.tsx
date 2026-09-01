import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import {
  listPatients,
  listTreatmentTypes,
  patientStatus,
  STATUS_LABEL,
  type PatientStatus,
} from "@/modules/patients";
import {
  Button,
  Card,
  EmptyState,
  Icon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@/modules/core/design-system";
import { StatusPill } from "./status-pill";

export const metadata: Metadata = { title: "מטופלים" };

type SP = { q?: string; status?: string; tt?: string; deleted?: string };

export default async function PatientsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = (patientStatus as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as PatientStatus)
    : undefined;
  const q = sp.q?.trim() || undefined;

  const tdb = await getTherapistDb();
  const types = await listTreatmentTypes(tdb, { includeInactive: true });
  const tt = types.some((t) => t.name === sp.tt) ? sp.tt : undefined;
  const patients = await listPatients(tdb, { search: q, status, treatmentType: tt });

  const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });
  const qs = (patch: Partial<SP>) => {
    const p = new URLSearchParams();
    const merged = { q, status: sp.status, tt: sp.tt, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, String(v));
    const s = p.toString();
    return s ? `/t/patients?${s}` : "/t/patients";
  };

  return (
    <div className="space-y-5">
      {sp.deleted && (
        <p className="border-line bg-surface-2 text-ink-soft rounded-lg border px-4 py-2.5 text-[13px]">
          המטופל/ת וכל הנתונים נמחקו לצמיתות.
        </p>
      )}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">מטופלים</h1>
          <p className="text-ink-soft text-sm">{patients.length} מוצגים</p>
        </div>
        <Button asChild>
          <Link href="/t/patients/new">
            <Icon name="plus" size={16} /> מטופל חדש
          </Link>
        </Button>
      </header>

      <form className="flex flex-wrap items-center gap-2.5" method="get">
        {sp.status ? <input type="hidden" name="status" value={sp.status} /> : null}
        {sp.tt ? <input type="hidden" name="tt" value={sp.tt} /> : null}
        <label className="border-line bg-surface text-ink-faint flex min-w-56 items-center gap-2 rounded-[10px] border px-3 py-2">
          <Icon name="search" size={16} />
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="שם, טלפון, דוא״ל או מזהה"
            className="text-ink w-full bg-transparent text-sm outline-none"
          />
        </label>
        <Button type="submit" size="sm" variant="outline">
          חיפוש
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        <FilterChip href={qs({ status: undefined })} active={!status}>
          כל הסטטוסים
        </FilterChip>
        {patientStatus.map((s) => (
          <FilterChip key={s} href={qs({ status: s })} active={status === s}>
            {STATUS_LABEL[s]}
          </FilterChip>
        ))}
        <span className="bg-line mx-1 w-px self-stretch" />
        <FilterChip href={qs({ tt: undefined })} active={!tt}>
          כל הטיפולים
        </FilterChip>
        {types.map((t) => (
          <FilterChip key={t.id} href={qs({ tt: t.name })} active={tt === t.name}>
            {t.name}
          </FilterChip>
        ))}
      </div>

      {patients.length === 0 ? (
        <EmptyState
          icon="users"
          title="אין מטופלים תואמים"
          description="נקו את הסינון, או הוסיפו מטופל ראשון ושלחו לו הזמנה."
          action={
            <Button asChild size="sm">
              <Link href="/t/patients/new">מטופל חדש</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם</TableHead>
                  <TableHead>סוגי טיפול</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>הצטרפ/ה</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-semibold whitespace-nowrap">
                      <Link href={`/t/patients/${p.id}`} className="hover:underline">
                        {p.firstName} {p.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {p.treatmentTypes.map((t) => (
                          <span
                            key={t}
                            className="bg-sage-soft text-sage-deep rounded-md px-2 py-0.5 text-[11px] font-semibold"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={p.status} />
                    </TableCell>
                    <TableCell className="text-ink-soft whitespace-nowrap tabular-nums">
                      {dtf.format(p.joinedAt)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/t/patients/${p.id}`}
                        className="text-ink-faint"
                        aria-label="פתיחת תיק"
                      >
                        <Icon name="chevron" size={16} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors",
        active
          ? "border-sage bg-sage-soft text-sage-deep"
          : "border-line text-ink-soft hover:border-sage",
      )}
    >
      {children}
    </Link>
  );
}
