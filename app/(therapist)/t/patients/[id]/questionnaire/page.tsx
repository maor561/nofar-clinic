import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getPatient } from "@/modules/patients";
import { listPatientQuestionnaires, getResponseDetail } from "@/modules/questionnaires";
import { Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";
import { AnswersList } from "@/app/(patient)/p/questionnaire/answers";

export const metadata: Metadata = { title: "שאלונים" };

const dtf = clinicDateFmt({ dateStyle: "long" });

export default async function PatientQuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const list = await listPatientQuestionnaires(tdb, id);
  const details = await Promise.all(list.map((q) => getResponseDetail(tdb, q.id)));
  await audit("view", "questionnaire_response", { patientId: id });

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
          שאלונים · {p.firstName} {p.lastName}
        </h1>
      </header>

      {list.length === 0 ? (
        <EmptyState
          icon="form"
          title="לא שויכו שאלונים"
          description="אפשר לשייך שאלונים למטופל/ת מטופס העריכה או בהקמה."
        />
      ) : (
        list.map((q, i) => {
          const d = details[i];
          return (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle>{q.templateName}</CardTitle>
                <span className="text-ink-faint text-xs">
                  {q.status === "submitted"
                    ? `הוגש ${q.submittedAt ? "ב־" + dtf.format(q.submittedAt) : ""}`
                    : "טרם הוגש"}
                </span>
              </CardHeader>
              <CardContent>
                {d && d.fields.length > 0 ? (
                  <AnswersList fields={d.fields} />
                ) : (
                  <p className="text-ink-faint text-sm">אין תשובות עדיין.</p>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
