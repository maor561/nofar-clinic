import type { Metadata } from "next";
import Link from "next/link";
import { getPatientDb } from "@/modules/core/authz/server";
import { getQuestionnaire, questionnaireFieldDefs } from "@/modules/questionnaires";
import type { FieldSchema } from "@/modules/core/fields";
import { Button } from "@/modules/core/design-system";
import { QuestionnaireForm, type QFieldDef } from "./questionnaire-form";
import { AnswersList } from "./answers";
import { submitQuestionnaireAction } from "./actions";

export const metadata: Metadata = { title: "שאלון קליטה" };

const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "long" });

type SP = { edit?: string };

export default async function QuestionnairePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return null;

  const [view, defsRaw] = await Promise.all([
    getQuestionnaire(pdb, me.id),
    questionnaireFieldDefs(pdb),
  ]);
  const submitted = view?.response.status === "submitted";
  const editing = sp.edit === "1" || !submitted;

  const fieldDefs: QFieldDef[] = defsRaw.map((d) => ({
    definitionId: d.id,
    key: d.key,
    labelHe: d.labelHe,
    type: d.type,
    unit: d.unit,
    schema: d.schema as FieldSchema,
  }));
  const values = Object.fromEntries((view?.fields ?? []).map((f) => [f.definitionId, f.value]));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">שאלון קליטה</h1>
        <p className="text-ink-soft text-sm">
          {submitted && !editing
            ? `הוגש ב־${view ? dtf.format(view.response.submittedAt ?? view.response.updatedAt) : ""}. אפשר לעדכן בכל עת.`
            : "כמה שאלות קצרות שיעזרו לנופר להכיר אותך לפני המפגש הראשון."}
        </p>
      </header>

      {submitted && !editing ? (
        <>
          <AnswersList fields={view!.fields} />
          <Button asChild variant="outline" size="sm">
            <Link href="/p/questionnaire?edit=1">עריכה ושליחה מחדש</Link>
          </Button>
        </>
      ) : (
        <QuestionnaireForm
          action={submitQuestionnaireAction}
          fieldDefs={fieldDefs}
          values={values}
          submitLabel={submitted ? "עדכון ושליחה מחדש" : "שליחת השאלון"}
        />
      )}
    </div>
  );
}
