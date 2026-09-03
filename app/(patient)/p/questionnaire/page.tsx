import type { Metadata } from "next";
import Link from "next/link";
import { getPatientDb } from "@/modules/core/authz/server";
import { listPatientQuestionnaires } from "@/modules/questionnaires";
import { Card, EmptyState, Icon } from "@/modules/core/design-system";
import { clinicDateFmt } from "@/lib/tz";

export const metadata: Metadata = { title: "שאלונים" };

const dtf = clinicDateFmt({ dateStyle: "long" });

export default async function QuestionnaireListPage() {
  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return null;

  const items = await listPatientQuestionnaires(pdb, me.id);
  const open = items.filter((q) => q.status === "open");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">השאלונים שלי</h1>
        <p className="text-ink-soft text-sm">
          {open.length > 0
            ? `${open.length} שאלונים ממתינים למילוי לפני המפגש הראשון.`
            : "כל השאלונים מולאו. אפשר לעדכן תשובות בכל עת."}
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon="form"
          title="אין שאלונים"
          description="כשנופר תשלח לך שאלון, הוא יופיע כאן."
        />
      ) : (
        <ul className="space-y-2.5">
          {items.map((q) => (
            <li key={q.id}>
              <Link href={`/p/questionnaire/${q.id}`}>
                <Card className="hover:border-sage flex items-center gap-3 p-4 transition-colors">
                  <Icon name="form" size={18} className="text-ink-faint shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{q.templateName}</span>
                    <span className="text-ink-faint text-[13px]">
                      {q.status === "submitted"
                        ? `הוגש ${q.submittedAt ? "ב־" + dtf.format(q.submittedAt) : ""}`
                        : "ממתין למילוי"}
                    </span>
                  </span>
                  <span
                    className={
                      q.status === "submitted"
                        ? "bg-sage-soft text-sage-deep rounded-full px-2 py-0.5 text-xs font-bold"
                        : "bg-warn-soft text-warn rounded-full px-2 py-0.5 text-xs font-bold"
                    }
                  >
                    {q.status === "submitted" ? "הוגש" : "למילוי"}
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
