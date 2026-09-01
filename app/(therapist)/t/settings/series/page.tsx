import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listSeriesTemplates, listTreatmentTypes } from "@/modules/patients";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Input,
} from "@/modules/core/design-system";
import { updateSeriesAction, toggleSeriesAction } from "./actions";
import { AddSeriesForm } from "./series-form";

export const metadata: Metadata = { title: "סדרות טיפול" };

export default async function SeriesSettingsPage() {
  const tdb = await getTherapistDb();
  const [series, types] = await Promise.all([
    listSeriesTemplates(tdb, { includeInactive: true }),
    listTreatmentTypes(tdb),
  ]);

  return (
    <div className="max-w-2xl space-y-5">
      <header className="space-y-1">
        <Link
          href="/t/settings"
          className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
        >
          <Icon name="chevron" size={14} /> להגדרות
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">סדרות טיפול</h1>
        <p className="text-ink-soft text-sm">
          חבילת מפגשים בשם ובמספר קבוע. בוחרים סדרה בהקמת מטופל או מהתיק שלו; המונה עולה בכל פגישה
          שמסומנת כהתקיימה, והסדרה נסגרת אוטומטית כשמגיעים למכסה.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>הרשימה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {series.length === 0 ? (
            <p className="text-ink-faint text-[13px]">אין סדרות. הוסיפו את הראשונה למטה.</p>
          ) : (
            <ul className="divide-line-soft divide-y">
              {series.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
                  <form
                    action={updateSeriesAction.bind(null, s.id)}
                    className="flex flex-1 flex-wrap items-center gap-2"
                  >
                    <Input
                      name="name"
                      defaultValue={s.name}
                      maxLength={80}
                      required
                      className={s.active ? "flex-1" : "text-ink-faint flex-1 line-through"}
                    />
                    <Input
                      name="sessionCount"
                      type="number"
                      min={1}
                      max={100}
                      defaultValue={s.sessionCount}
                      required
                      className="w-20"
                    />
                    {s.treatmentType && (
                      <span className="bg-sage-soft text-sage-deep rounded-md px-2 py-0.5 text-[11px] font-semibold">
                        {s.treatmentType}
                      </span>
                    )}
                    <Button type="submit" variant="outline" size="sm">
                      שמירה
                    </Button>
                  </form>
                  <form action={toggleSeriesAction.bind(null, s.id, !s.active)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {s.active ? "השבתה" : "הפעלה"}
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הוספה</CardTitle>
        </CardHeader>
        <CardContent>
          <AddSeriesForm treatmentTypes={types.map((t) => t.name)} />
        </CardContent>
      </Card>
    </div>
  );
}
