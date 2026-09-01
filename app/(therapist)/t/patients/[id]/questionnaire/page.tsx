import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { audit } from "@/modules/core/audit/server";
import { getPatient } from "@/modules/patients";
import { getQuestionnaire } from "@/modules/questionnaires";
import { EmptyState } from "@/modules/core/design-system";
import { AnswersList } from "@/app/(patient)/p/questionnaire/answers";

export const metadata: Metadata = { title: "שאלון קליטה" };

const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "long" });

export default async function PatientQuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const view = await getQuestionnaire(tdb, id);
  await audit("view", "questionnaire_response", { patientId: id, entityId: view?.response.id });

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
          שאלון קליטה · {p.firstName} {p.lastName}
        </h1>
        {view?.response.status === "submitted" && (
          <p className="text-ink-soft mt-1 text-sm">
            הוגש ב־{dtf.format(view.response.submittedAt ?? view.response.updatedAt)}
          </p>
        )}
        {view && view.response.status === "open" && (
          <p className="text-ink-soft mt-1 text-sm">טיוטה — טרם הוגש</p>
        )}
      </header>

      {!view ? (
        <EmptyState
          icon="form"
          title="השאלון טרם מולא"
          description="המטופל/ת יראה את השאלון במרחב שלו וימלא אותו לפני המפגש."
        />
      ) : (
        <AnswersList fields={view.fields} />
      )}
    </div>
  );
}
