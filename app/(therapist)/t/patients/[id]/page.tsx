import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getPatient, TREATMENT_LABEL, CONSENT_LABEL } from "@/modules/patients";
import {
  listTimeline,
  countTimeline,
  timelineEventType,
  TIMELINE_LABEL,
  type TimelineEventType,
} from "@/modules/patient-file";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  cn,
} from "@/modules/core/design-system";
import { StatusPill } from "../status-pill";
import { PatientTimeline } from "./timeline";

export const metadata: Metadata = { title: "תיק מטופל — נופר" };

type SP = { ev?: string };

export default async function PatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  await audit("view", "patient", { patientId: id, entityId: id });

  const ev = (timelineEventType as readonly string[]).includes(sp.ev ?? "")
    ? (sp.ev as TimelineEventType)
    : undefined;
  const [events, total] = await Promise.all([
    listTimeline(tdb, id, { types: ev ? [ev] : undefined, limit: 500 }),
    countTimeline(tdb, id),
  ]);

  const evHref = (t?: TimelineEventType) => (t ? `/t/patients/${id}?ev=${t}` : `/t/patients/${id}`);

  // server component render — computing "now" per request is fine here
  /* eslint-disable react-hooks/purity */
  const dob = p.dob ? new Date(p.dob).toLocaleDateString("he-IL", { dateStyle: "medium" }) : null;
  const age = p.dob
    ? Math.floor((Date.now() - new Date(p.dob).getTime()) / (365.25 * 864e5))
    : null;
  const joined = new Date(p.joinedAt).toLocaleDateString("he-IL", { dateStyle: "medium" });
  /* eslint-enable react-hooks/purity */

  return (
    <div className="space-y-5">
      <Link href="/t/patients" className="text-sage-deep text-sm font-semibold hover:underline">
        ← חזרה לרשימה
      </Link>

      <header className="border-line flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div className="flex items-start gap-4">
          <span className="bg-sage-soft text-sage-deep grid size-14 place-items-center rounded-full font-[family-name:var(--font-display)] text-xl font-bold">
            {p.firstName[0]}
            {p.lastName[0]}
          </span>
          <div>
            <h1 className="flex items-center gap-2.5 font-[family-name:var(--font-display)] text-2xl font-bold">
              {p.firstName} {p.lastName}
              <StatusPill status={p.status} />
            </h1>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {p.treatmentTypes.map((t) => (
                <span
                  key={t}
                  className="bg-sage-soft text-sage-deep rounded-md px-2 py-0.5 text-[11px] font-semibold"
                >
                  {TREATMENT_LABEL[t]}
                </span>
              ))}
            </div>
            <p className="text-ink-soft mt-2 text-[13px]">
              {age != null && (
                <>
                  בת/בן <b className="text-ink">{age}</b> ·{" "}
                </>
              )}
              הצטרפ/ה ב־<b className="text-ink">{joined}</b>
              {p.treatmentGoal && (
                <>
                  {" "}
                  · יעד: <b className="text-ink">{p.treatmentGoal}</b>
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/patients/${id}/edit`}>
              <Icon name="settings" size={16} /> עריכה
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ציר זמן</CardTitle>
              <span className="text-ink-faint text-xs tabular-nums">{total} אירועים</span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <TlChip href={evHref()} active={!ev}>
                  הכול
                </TlChip>
                {timelineEventType.map((t) => (
                  <TlChip key={t} href={evHref(t)} active={ev === t}>
                    {TIMELINE_LABEL[t]}
                  </TlChip>
                ))}
              </div>
              <PatientTimeline entries={events} />
            </CardContent>
          </Card>

          {p.generalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>הערות כלליות</CardTitle>
              </CardHeader>
              <CardContent className="text-ink-soft text-sm whitespace-pre-wrap">
                {p.generalNotes}
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>יצירת קשר</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-sm">
              {p.phone ? (
                <p className="flex items-center gap-2">
                  <Icon name="phone" size={15} className="text-ink-faint" /> {p.phone}
                </p>
              ) : null}
              {p.email ? (
                <p className="flex items-center gap-2">
                  <Icon name="mail" size={15} className="text-ink-faint" /> {p.email}
                </p>
              ) : null}
              {p.address ? <p className="text-ink-soft">{p.address}</p> : null}
              {dob ? <p className="text-ink-faint">ת. לידה: {dob}</p> : null}
              {!p.phone && !p.email && !p.address && (
                <p className="text-ink-faint">אין פרטי יצירת קשר</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>הסכמות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-[13px]">
              {p.consents.length === 0 ? (
                <p className="text-ink-faint">לא נרשמו הסכמות</p>
              ) : (
                p.consents.map((k) => (
                  <p key={k} className="text-sage-deep flex items-start gap-2">
                    <Icon name="task-done" size={15} className="mt-0.5" /> {CONSENT_LABEL[k]}
                  </p>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function TlChip({
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
        "rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold transition-colors",
        active
          ? "border-sage bg-sage-soft text-sage-deep"
          : "border-line text-ink-soft hover:border-sage",
      )}
    >
      {children}
    </Link>
  );
}
