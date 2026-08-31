import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getAvailabilitySettings } from "@/modules/availability";
import { Card, CardContent, CardHeader, CardTitle, Icon } from "@/modules/core/design-system";
import {
  AvailabilityForm,
  BlockedDates,
  type DayValue,
  type PolicyValue,
} from "./availability-form";

export const metadata: Metadata = { title: "זמינות וקביעת תורים — נופר" };

function hhmm(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export default async function AvailabilityPage() {
  const tdb = await getTherapistDb();
  const { policy, rules, exceptions } = await getAvailabilitySettings(tdb);

  const byWeekday = new Map(rules.map((r) => [r.weekday, r]));
  const days: DayValue[] = Array.from({ length: 7 }, (_, i) => {
    const r = byWeekday.get(i);
    return r
      ? { enabled: true, start: hhmm(r.startMinute), end: hhmm(r.endMinute) }
      : { enabled: false, start: "09:00", end: "16:00" };
  });

  const policyValue: PolicyValue = {
    selfSchedulingEnabled: policy.selfSchedulingEnabled,
    slotMinutes: policy.slotMinutes,
    granularityMinutes: policy.granularityMinutes,
    leadHours: policy.leadHours,
    horizonDays: policy.horizonDays,
    bufferMinutes: policy.bufferMinutes,
  };

  return (
    <div className="max-w-2xl space-y-5">
      <header className="space-y-1">
        <Link
          href="/t/settings"
          className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
        >
          <Icon name="chevron" size={14} /> להגדרות
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          זמינות וקביעת תורים
        </h1>
        <p className="text-ink-soft text-sm">
          שעות העבודה שלך והכללים שלפיהם מטופלים יכולים לקבוע תור בעצמם. פגישה שמטופל קובע מאושרת
          אוטומטית ונכנסת ליומן.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>שעות ומדיניות</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityForm days={days} policy={policyValue} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>תאריכים חסומים</CardTitle>
        </CardHeader>
        <CardContent>
          <BlockedDates items={exceptions.map((e) => ({ id: e.id, date: e.date, note: e.note }))} />
        </CardContent>
      </Card>
    </div>
  );
}
