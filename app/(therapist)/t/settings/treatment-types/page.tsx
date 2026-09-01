import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listTreatmentTypes } from "@/modules/patients";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Input,
} from "@/modules/core/design-system";
import { renameTypeAction, toggleTypeAction } from "./actions";
import { AddTypeForm } from "./types-form";

export const metadata: Metadata = { title: "סוגי טיפול — נופר" };

export default async function TreatmentTypesPage() {
  const tdb = await getTherapistDb();
  const types = await listTreatmentTypes(tdb, { includeInactive: true });

  return (
    <div className="max-w-2xl space-y-5">
      <header className="space-y-1">
        <Link
          href="/t/settings"
          className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
        >
          <Icon name="chevron" size={14} /> להגדרות
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">סוגי טיפול</h1>
        <p className="text-ink-soft text-sm">
          הרשימה שממנה בוחרים סוג טיפול בהקמת מטופל, ביומן ובתיעוד מפגש. שינוי שם מתעדכן גם ברשומות
          קיימות. סוג לא פעיל נשמר ברשומות ישנות אך לא מוצע לבחירות חדשות.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>הרשימה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {types.length === 0 ? (
            <p className="text-ink-faint text-[13px]">אין סוגי טיפול. הוסיפו את הראשון למטה.</p>
          ) : (
            <ul className="divide-line-soft divide-y">
              {types.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-2 py-2">
                  <form
                    action={renameTypeAction.bind(null, t.id)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <Input
                      name="name"
                      defaultValue={t.name}
                      maxLength={60}
                      required
                      className={t.active ? "" : "text-ink-faint line-through"}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      שמירה
                    </Button>
                  </form>
                  <form action={toggleTypeAction.bind(null, t.id, !t.active)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {t.active ? "השבתה" : "הפעלה"}
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
          <AddTypeForm />
        </CardContent>
      </Card>
    </div>
  );
}
