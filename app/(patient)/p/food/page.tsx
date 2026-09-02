import type { Metadata } from "next";
import Link from "next/link";
import { getPatientDb } from "@/modules/core/authz/server";
import { getFoodDay, countLoggedDays } from "@/modules/food-log";
import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/modules/core/design-system";
import { clinicDateFmt, toClinicFields, clinicWeekStart } from "@/lib/tz";
import { FoodForm } from "./food-form";

export const metadata: Metadata = { title: "יומן אכילה" };

const DAY = 86_400_000;
const longFmt = clinicDateFmt({ weekday: "long", day: "numeric", month: "long" });
const noteFmt = clinicDateFmt({ dateStyle: "medium", timeStyle: "short" });

function shift(dateStr: string, days: number): string {
  return toClinicFields(new Date(new Date(`${dateStr}T12:00:00Z`).getTime() + days * DAY)).date;
}

export default async function FoodLogPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const pdb = await getPatientDb();

  const today = toClinicFields(new Date()).date;
  const date = d && /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= today ? d : today;

  const day = await getFoodDay(pdb, pdb.patientId, date);

  const weekFrom = toClinicFields(clinicWeekStart(new Date(`${date}T12:00:00Z`))).date;
  const monthFrom = `${date.slice(0, 7)}-01`;
  const [weekCount, monthCount] = await Promise.all([
    countLoggedDays(pdb, pdb.patientId, weekFrom, today),
    countLoggedDays(pdb, pdb.patientId, monthFrom, today),
  ]);
  const monthDays = Number(today.slice(8, 10));

  const prev = shift(date, -1);
  const next = date < today ? shift(date, 1) : null;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">יומן אכילה</h1>
        <p className="text-ink-soft text-sm">
          רשמו מה אכלתם בכל ארוחה. נופר עוברת על היומן ומוסיפה הערות והכוונה.
        </p>
      </header>

      <div className="text-ink-faint flex items-center gap-4 text-[13px]">
        <span>
          השבוע: <b className="text-ink">{weekCount}/7</b>
        </span>
        <span>
          החודש: <b className="text-ink">{monthCount}</b> מתוך {monthDays}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <Link
          href={`/p/food?d=${prev}`}
          className="text-sage-deep flex items-center gap-1 font-semibold hover:underline"
        >
          <Icon name="chevron" size={14} /> יום קודם
        </Link>
        <span className="font-semibold">
          {longFmt.format(new Date(`${date}T12:00:00Z`))}
          {date === today && " · היום"}
        </span>
        {next ? (
          <Link
            href={`/p/food?d=${next}`}
            className="text-sage-deep flex items-center gap-1 font-semibold hover:underline"
          >
            יום הבא <Icon name="chevron" size={14} className="rotate-180" />
          </Link>
        ) : (
          <span className="text-ink-faint/50">יום הבא</span>
        )}
      </div>

      {day?.therapistNote && (
        <Card className="border-sage bg-sage-soft/30">
          <CardHeader>
            <CardTitle>הערה מנופר</CardTitle>
            {day.therapistNoteAt && (
              <span className="text-ink-faint text-xs">{noteFmt.format(day.therapistNoteAt)}</span>
            )}
          </CardHeader>
          <CardContent>
            <p className="text-ink text-sm whitespace-pre-wrap">{day.therapistNote}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-5">
          <FoodForm
            date={date}
            values={{
              wakeup: day?.wakeup ?? "",
              breakfast: day?.breakfast ?? "",
              lunch: day?.lunch ?? "",
              afternoon: day?.afternoon ?? "",
              evening: day?.evening ?? "",
              patientNote: day?.patientNote ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
