import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listTemplates } from "@/modules/questionnaires";
import { listManagedFieldDefs } from "@/modules/core/fields";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  Input,
} from "@/modules/core/design-system";
import { renameTemplateAction, toggleTemplateAction } from "./actions";
import { AddTemplateForm } from "./templates-form";

export const metadata: Metadata = { title: "שאלונים" };

export default async function QuestionnaireTemplatesPage() {
  const tdb = await getTherapistDb();
  const templates = await listTemplates(tdb, { includeInactive: true });
  const counts = await Promise.all(
    templates.map((t) =>
      listManagedFieldDefs(tdb.therapistId, "questionnaire", { templateId: t.id }).then(
        (d) => d.length,
      ),
    ),
  );

  return (
    <div className="max-w-2xl space-y-5">
      <header className="space-y-1">
        <Link
          href="/t/settings"
          className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
        >
          <Icon name="chevron" size={14} /> להגדרות
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">שאלונים</h1>
        <p className="text-ink-soft text-sm">
          מאגר השאלונים שלך. בהקמת מטופל/ת (או מטופס העריכה) אפשר לבחור אילו שאלונים לשלוח — יותר
          מאחד. שאלון לא פעיל נשמר ברשומות קיימות אך לא מוצע לשיוך חדש.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>המאגר</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {templates.length === 0 ? (
            <p className="text-ink-faint text-[13px]">אין שאלונים. צרו את הראשון למטה.</p>
          ) : (
            <ul className="divide-line-soft divide-y">
              {templates.map((t, i) => (
                <li key={t.id} className="flex flex-wrap items-center gap-2 py-2">
                  <form
                    action={renameTemplateAction.bind(null, t.id)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <Input
                      name="name"
                      defaultValue={t.name}
                      maxLength={80}
                      required
                      className={t.active ? "" : "text-ink-faint line-through"}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      שמירה
                    </Button>
                  </form>
                  <span className="text-ink-faint w-20 shrink-0 text-[12px]">
                    {counts[i]} שאלות
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/t/settings/questionnaires/${t.id}`}>עריכת שאלות</Link>
                  </Button>
                  <form action={toggleTemplateAction.bind(null, t.id, !t.active)}>
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
          <CardTitle>שאלון חדש</CardTitle>
        </CardHeader>
        <CardContent>
          <AddTemplateForm />
        </CardContent>
      </Card>
    </div>
  );
}
