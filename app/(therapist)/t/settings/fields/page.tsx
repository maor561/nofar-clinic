import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listManagedFieldDefs, type UiFieldType } from "@/modules/core/fields";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Input,
} from "@/modules/core/design-system";
import { renameFieldAction, toggleFieldAction, moveFieldAction } from "./actions";
import { AddFieldForm, TYPE_LABEL } from "./fields-form";

export const metadata: Metadata = { title: "מדדי מפגש" };

function schemaHint(type: string, schema: unknown): string {
  const s = (schema ?? {}) as Record<string, unknown>;
  if (type === "number" || type === "scale") {
    const lo = s.min ?? "—";
    const hi = s.max ?? "—";
    return `${lo}–${hi}`;
  }
  if (type === "select" && Array.isArray(s.options)) return `${s.options.length} אפשרויות`;
  return TYPE_LABEL[type as UiFieldType] ?? type;
}

export default async function SessionFieldsPage() {
  const tdb = await getTherapistDb();
  const defs = await listManagedFieldDefs(tdb.therapistId, "treatment_session", {
    includeInactive: true,
  });

  return (
    <div className="max-w-2xl space-y-5">
      <header className="space-y-1">
        <Link
          href="/t/settings"
          className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
        >
          <Icon name="chevron" size={14} /> להגדרות
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">מדדי מפגש</h1>
        <p className="text-ink-soft text-sm">
          הפרמטרים שנרשמים בכל תיעוד מפגש (משקל, אנרגיה, שינה…). מה שמוגדר כאן מופיע אוטומטית בטופס
          המפגש. מדד לא פעיל נשמר ברשומות קודמות אך לא מוצג בתיעוד חדש. סוג המדד וטווח הערכים ננעלים
          עם היצירה — לשינוי, השביתו וצרו מדד חדש.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>המדדים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {defs.length === 0 ? (
            <p className="text-ink-faint text-[13px]">אין מדדים מוגדרים. הוסיפו את הראשון למטה.</p>
          ) : (
            <ul className="divide-line-soft divide-y">
              {defs.map((d, i) => (
                <li key={d.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="flex shrink-0 flex-col">
                    <form action={moveFieldAction.bind(null, d.id, "up")}>
                      <button
                        type="submit"
                        disabled={i === 0}
                        aria-label="הזז למעלה"
                        className="text-ink-faint hover:text-ink block leading-none disabled:opacity-30"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={moveFieldAction.bind(null, d.id, "down")}>
                      <button
                        type="submit"
                        disabled={i === defs.length - 1}
                        aria-label="הזז למטה"
                        className="text-ink-faint hover:text-ink block leading-none disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </form>
                  </span>

                  <form
                    action={renameFieldAction.bind(null, d.id)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <Input
                      name="labelHe"
                      defaultValue={d.labelHe}
                      maxLength={60}
                      required
                      className={d.active ? "" : "text-ink-faint line-through"}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      שמירה
                    </Button>
                  </form>

                  <span className="text-ink-faint w-28 shrink-0 text-[12px]">
                    {TYPE_LABEL[d.type as UiFieldType] ?? d.type}
                    <span className="text-ink-faint/70"> · {schemaHint(d.type, d.schema)}</span>
                    {d.unit ? ` · ${d.unit}` : ""}
                  </span>

                  {d.builtin && (
                    <span className="bg-line-soft text-ink-soft shrink-0 rounded-full px-2 py-0.5 text-[11px]">
                      מובנה
                    </span>
                  )}

                  <form action={toggleFieldAction.bind(null, d.id, !d.active)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {d.active ? "השבתה" : "הפעלה"}
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
          <CardTitle>הוספת מדד</CardTitle>
        </CardHeader>
        <CardContent>
          <AddFieldForm />
        </CardContent>
      </Card>
    </div>
  );
}
