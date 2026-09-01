import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getSession, SESSION_SECTIONS } from "@/modules/sessions";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
} from "@/modules/core/design-system";

export const metadata: Metadata = { title: "מפגש" };

const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "long" });

function fmtFieldValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "כן" : "לא";
  return String(v);
}

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const s = await getSession(tdb, id);
  if (!s) notFound();

  await audit("view", "treatment_session", { patientId: s.patientId, entityId: id });

  const groups: { title: string; keys: (typeof SESSION_SECTIONS)[number][] }[] = [
    { title: "מצב המטופל/ת", keys: SESSION_SECTIONS.filter((x) => x.group === "state") },
    { title: "הטיפול שבוצע", keys: SESSION_SECTIONS.filter((x) => x.group === "treatment") },
    { title: "המלצות והמשך", keys: SESSION_SECTIONS.filter((x) => x.group === "followup") },
  ];
  const shared = s.patientSummary?.trim() || null;

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${s.patientId}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>

      <header className="border-line flex flex-wrap items-start justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            תיעוד מפגש · {dateFmt.format(new Date(`${s.date}T12:00:00Z`))}
          </h1>
          <p className="text-ink-soft mt-1 text-sm">
            {s.patientName}
            {s.treatmentTypes.length > 0 && <> · {s.treatmentTypes.join(" · ")}</>}
            {s.appointmentId && (
              <>
                {" · "}
                <Link
                  href={`/t/calendar/${s.appointmentId}`}
                  className="text-sage-deep hover:underline"
                >
                  פגישה מקושרת
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/patients/${s.patientId}/tasks/new`}>
              <Icon name="task-done" size={16} /> משימה מהמפגש
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/t/sessions/${id}/edit`}>
              <Icon name="settings" size={16} /> עריכה
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <Card className={shared ? "border-sage bg-sage-soft/30" : undefined}>
            <CardHeader>
              <CardTitle>סיכום למטופל/ת</CardTitle>
            </CardHeader>
            <CardContent>
              {shared ? (
                <>
                  <p className="text-ink text-sm whitespace-pre-wrap">{shared}</p>
                  <p className="text-ink-faint mt-2 text-[11px]">
                    נשלח למטופל/ת במייל ומוצג באפליקציה שלו/ה.
                  </p>
                </>
              ) : (
                <p className="text-ink-faint text-sm">
                  לא שותף סיכום. אפשר להוסיף בעריכת המפגש — הטקסט יישלח למטופל/ת.
                </p>
              )}
            </CardContent>
          </Card>

          {groups.map((g) => (
            <Card key={g.title}>
              <CardHeader>
                <CardTitle>{g.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {g.keys.map((k) => {
                  const val = s[k.key as keyof typeof s] as string | null;
                  return (
                    <div key={k.key}>
                      <p className="text-ink-faint text-[11px] font-bold">{k.labelHe}</p>
                      <p className="text-ink text-sm whitespace-pre-wrap">{val || "—"}</p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>מדדים</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {s.fields.length === 0 ? (
                <p className="text-ink-faint">לא נרשמו מדדים</p>
              ) : (
                s.fields.map((f) => (
                  <div key={f.definitionId} className="flex items-baseline justify-between gap-2">
                    <span className="text-ink-soft">{f.labelHe}</span>
                    <span className="font-semibold tabular-nums">
                      {fmtFieldValue(f.value)}
                      {f.unit ? ` ${f.unit}` : ""}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
