import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getPatient } from "@/modules/patients";
import { getFoodDay, listFoodDays, MEALS, MEAL_LABEL } from "@/modules/food-log";
import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/modules/core/design-system";
import { clinicDateFmt, toClinicFields } from "@/lib/tz";
import { TherapistNoteForm } from "./note-form";

export const metadata: Metadata = { title: "יומן אכילה" };

const longFmt = clinicDateFmt({ weekday: "long", day: "numeric", month: "long" });
const shortFmt = clinicDateFmt({ day: "2-digit", month: "2-digit" });

function excerpt(day: {
  wakeup: string | null;
  breakfast: string | null;
  lunch: string | null;
  afternoon: string | null;
  evening: string | null;
  patientNote: string | null;
}): string {
  const first = [day.breakfast, day.lunch, day.evening, day.wakeup, day.afternoon, day.patientNote]
    .map((s) => s?.trim())
    .find(Boolean);
  return first ? (first.length > 80 ? first.slice(0, 80) + "…" : first) : "—";
}

export default async function PatientFoodPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const { id } = await params;
  const { d } = await searchParams;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const days = await listFoodDays(tdb, id, { limit: 60 });
  const today = toClinicFields(new Date()).date;
  const date = d && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : (days[0]?.date ?? today);
  const day = await getFoodDay(tdb, id, date);
  await audit("view", "food_log_day", { patientId: id });

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>
      <header className="border-line border-b pb-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          יומן אכילה · {p.firstName} {p.lastName}
        </h1>
      </header>

      {days.length === 0 ? (
        <p className="text-ink-faint text-sm">המטופל/ת עדיין לא מילא/ה את יומן האכילה.</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <p className="text-ink-soft text-sm font-semibold">
              {longFmt.format(new Date(`${date}T12:00:00Z`))}
            </p>

            <Card>
              <CardHeader>
                <CardTitle>מה נאכל</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {MEALS.map((m) => (
                  <div key={m}>
                    <p className="text-ink-faint text-[11px] font-bold">{MEAL_LABEL[m]}</p>
                    <p className="text-ink text-sm whitespace-pre-wrap">{day?.[m] || "—"}</p>
                  </div>
                ))}
                <div>
                  <p className="text-ink-faint text-[11px] font-bold">הערות המטופל/ת</p>
                  <p className="text-ink text-sm whitespace-pre-wrap">{day?.patientNote || "—"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>הערת משוב (מוצגת למטופל/ת)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TherapistNoteForm
                  patientId={id}
                  date={date}
                  defaultNote={day?.therapistNote ?? ""}
                />
                <div className="text-ink-faint flex flex-wrap gap-3 text-[13px]">
                  <Link href={`/t/patients/${id}/tasks/new`} className="hover:underline">
                    + משימה מהיומן
                  </Link>
                  <Link href={`/t/patients/${id}/plan/edit`} className="hover:underline">
                    ← עדכון תוכנית
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside>
            <p className="text-ink-faint mb-2 text-[11px] font-bold">ימים</p>
            <ul className="divide-line-soft divide-y">
              {days.map((dd) => (
                <li key={dd.id}>
                  <Link
                    href={`/t/patients/${id}/food?d=${dd.date}`}
                    className={
                      dd.date === date
                        ? "bg-sage-soft text-sage-deep block rounded-lg px-2.5 py-2"
                        : "text-ink-soft hover:bg-sage-tint block rounded-lg px-2.5 py-2"
                    }
                  >
                    <span className="flex items-center justify-between text-[13px] font-semibold">
                      {shortFmt.format(new Date(`${dd.date}T12:00:00Z`))}
                      {dd.therapistNote ? <Icon name="check" size={13} /> : null}
                    </span>
                    <span className="text-ink-faint block truncate text-[11px]">{excerpt(dd)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
