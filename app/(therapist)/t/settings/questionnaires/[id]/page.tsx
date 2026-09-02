import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getTemplate } from "@/modules/questionnaires";
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
import {
  renameQuestionAction,
  toggleQuestionAction,
  moveQuestionAction,
  updateTemplateIntroAction,
} from "../actions";
import { AddQuestionForm, Q_TYPE_LABEL } from "./question-form";

export const metadata: Metadata = { title: "עריכת שאלון" };

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const tpl = await getTemplate(tdb, id);
  if (!tpl) notFound();

  const questions = await listManagedFieldDefs(tdb.therapistId, "questionnaire", {
    includeInactive: true,
    templateId: id,
  });

  return (
    <div className="max-w-2xl space-y-5">
      <header className="space-y-1">
        <Link
          href="/t/settings/questionnaires"
          className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
        >
          <Icon name="chevron" size={14} /> לשאלונים
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">{tpl.name}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>טקסט פתיחה למטופל/ת</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateTemplateIntroAction.bind(null, id)} className="space-y-2">
            <textarea
              name="descriptionHe"
              defaultValue={tpl.descriptionHe ?? ""}
              rows={4}
              className="border-line bg-surface w-full rounded-lg border px-2.5 py-2 text-sm"
              placeholder="הסבר קצר שיוצג מעל השאלון (רשות)"
            />
            <Button type="submit" variant="outline" size="sm">
              שמירת הטקסט
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>שאלות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {questions.length === 0 ? (
            <p className="text-ink-faint text-[13px]">אין שאלות. הוסיפו את הראשונה למטה.</p>
          ) : (
            <ul className="divide-line-soft divide-y">
              {questions.map((q, i) => (
                <li key={q.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="flex shrink-0 flex-col">
                    <form action={moveQuestionAction.bind(null, id, q.id, "up")}>
                      <button
                        type="submit"
                        disabled={i === 0}
                        aria-label="למעלה"
                        className="text-ink-faint hover:text-ink block leading-none disabled:opacity-30"
                      >
                        ▲
                      </button>
                    </form>
                    <form action={moveQuestionAction.bind(null, id, q.id, "down")}>
                      <button
                        type="submit"
                        disabled={i === questions.length - 1}
                        aria-label="למטה"
                        className="text-ink-faint hover:text-ink block leading-none disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </form>
                  </span>
                  <form
                    action={renameQuestionAction.bind(null, id, q.id)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <Input
                      name="labelHe"
                      defaultValue={q.labelHe}
                      maxLength={300}
                      required
                      className={q.active ? "" : "text-ink-faint line-through"}
                    />
                    <Button type="submit" variant="outline" size="sm">
                      שמירה
                    </Button>
                  </form>
                  <span className="text-ink-faint w-24 shrink-0 text-[12px]">
                    {Q_TYPE_LABEL[q.type as keyof typeof Q_TYPE_LABEL] ?? (q.type as UiFieldType)}
                  </span>
                  <form action={toggleQuestionAction.bind(null, id, q.id, !q.active)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {q.active ? "השבתה" : "הפעלה"}
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
          <CardTitle>הוספת שאלה</CardTitle>
        </CardHeader>
        <CardContent>
          <AddQuestionForm templateId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
