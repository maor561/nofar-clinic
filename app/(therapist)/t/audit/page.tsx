import type { Metadata } from "next";
import { requireTherapist } from "@/modules/core/auth/server";
import { queryAudit } from "@/modules/core/audit";
import type { AuditAction } from "@/modules/core/audit";
import {
  Card,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/core/design-system";

export const metadata: Metadata = { title: "יומן פעילות" };

const ACTION_LABEL: Record<AuditAction, string> = {
  view: "צפייה",
  create: "יצירה",
  update: "עדכון",
  delete: "מחיקה",
  login: "כניסה",
  login_failed: "כניסה נכשלה",
  invite: "הזמנה",
  export: "ייצוא",
};
const ACTIONS = Object.keys(ACTION_LABEL) as AuditAction[];

function parseDate(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; patientId?: string; from?: string; to?: string }>;
}) {
  const session = await requireTherapist();
  const sp = await searchParams;

  const action = ACTIONS.includes(sp.action as AuditAction)
    ? (sp.action as AuditAction)
    : undefined;
  const patientId = sp.patientId?.trim() || undefined;
  const from = parseDate(sp.from);
  const to = parseDate(sp.to);

  const rows = await queryAudit(session.therapistId, { action, patientId, from, to, limit: 200 });

  const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">יומן פעילות</h1>
        <p className="text-ink-soft text-sm">
          רישום append-only של כל גישה למידע מטופל וכל אירוע אבטחה. שמירה: שנתיים.
        </p>
      </header>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="text-ink-soft grid gap-1 text-xs font-bold">
          פעולה
          <select
            name="action"
            defaultValue={action ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          >
            <option value="">הכל</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {ACTION_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-ink-soft grid gap-1 text-xs font-bold">
          מזהה מטופל
          <input
            name="patientId"
            defaultValue={patientId ?? ""}
            placeholder="uuid"
            className="border-input h-8 w-56 rounded-lg border bg-transparent px-2.5 text-sm"
          />
        </label>
        <label className="text-ink-soft grid gap-1 text-xs font-bold">
          מתאריך
          <input
            type="date"
            name="from"
            defaultValue={sp.from ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          />
        </label>
        <label className="text-ink-soft grid gap-1 text-xs font-bold">
          עד תאריך
          <input
            type="date"
            name="to"
            defaultValue={sp.to ?? ""}
            className="border-input h-8 rounded-lg border bg-transparent px-2.5 text-sm"
          />
        </label>
        <button
          type="submit"
          className="bg-sage-deep h-8 rounded-lg px-4 text-sm font-semibold text-white"
        >
          סינון
        </button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon="status"
          title="אין רשומות"
          description="עדיין אין פעילות שתואמת את הסינון. פעולות במערכת יופיעו כאן אוטומטית."
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>זמן</TableHead>
                <TableHead>מבצע</TableHead>
                <TableHead>פעולה</TableHead>
                <TableHead>ישות</TableHead>
                <TableHead>מטופל</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-ink-soft whitespace-nowrap tabular-nums">
                    {dtf.format(r.at)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.actorRole}
                    {r.actorUserId ? (
                      <span className="text-ink-faint"> · {r.actorUserId.slice(0, 8)}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-semibold">{ACTION_LABEL[r.action]}</TableCell>
                  <TableCell className="text-ink-soft">{r.entity}</TableCell>
                  <TableCell className="text-ink-soft tabular-nums">
                    {r.patientId ? r.patientId.slice(0, 8) : "—"}
                  </TableCell>
                  <TableCell className="text-ink-faint tabular-nums">{r.ip ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
