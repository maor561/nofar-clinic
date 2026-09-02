import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatientDb } from "@/modules/core/authz/server";
import { getResponseDetail, templateQuestions } from "@/modules/questionnaires";
import { fieldDefinitionsFor, type FieldSchema } from "@/modules/core/fields";
import { Button, Icon } from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";
import { QuestionnaireForm, type QFieldDef } from "../questionnaire-form";
import { AnswersList } from "../answers";
import { submitResponseAction } from "./actions";

export const metadata: Metadata = { title: "מילוי שאלון" };

const dtf = clinicDateFmt({ dateStyle: "long" });

export default async function FillQuestionnairePage({
  params,
  searchParams,
}: {
  params: Promise<{ rid: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { rid } = await params;
  const { edit } = await searchParams;
  const pdb = await getPatientDb();

  const detail = await getResponseDetail(pdb, rid);
  if (!detail) notFound();

  const defsRaw = detail.response.templateId
    ? await templateQuestions(pdb, detail.response.templateId)
    : await fieldDefinitionsFor(pdb.therapistId, "questionnaire", null);

  const fieldDefs: QFieldDef[] = defsRaw.map((d) => ({
    definitionId: d.id,
    key: d.key,
    labelHe: d.labelHe,
    type: d.type,
    unit: d.unit,
    schema: d.schema as FieldSchema,
  }));
  const values = Object.fromEntries(detail.fields.map((f) => [f.definitionId, f.value]));

  const submitted = detail.response.status === "submitted";
  const editing = edit === "1" || !submitted;
  const title = detail.template?.name ?? "שאלון קליטה";

  return (
    <div className="space-y-5">
      <Link
        href="/p/questionnaire"
        className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
      >
        <Icon name="chevron" size={14} /> לשאלונים שלי
      </Link>

      <header className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">{title}</h1>
        {detail.template?.descriptionHe && (
          <p className="text-ink-soft max-w-xl text-sm whitespace-pre-wrap">
            {detail.template.descriptionHe}
          </p>
        )}
        {submitted && !editing && (
          <p className="text-ink-faint text-[13px]">
            הוגש {detail.response.submittedAt ? `ב־${dtf.format(detail.response.submittedAt)}` : ""}
            . אפשר לעדכן בכל עת.
          </p>
        )}
      </header>

      {submitted && !editing ? (
        <>
          <AnswersList fields={detail.fields} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/p/questionnaire/${rid}?edit=1`}>עריכה ושליחה מחדש</Link>
          </Button>
        </>
      ) : (
        <QuestionnaireForm
          action={submitResponseAction.bind(null, rid)}
          fieldDefs={fieldDefs}
          values={values}
          submitLabel={submitted ? "עדכון ושליחה מחדש" : "שליחת השאלון"}
        />
      )}
    </div>
  );
}
