import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import {
  listRetentionReview,
  DOCUMENT_KIND_LABEL,
  RETENTION_DEFER_DAYS,
} from "@/modules/documents";
import { Button, Card, EmptyState, Icon } from "@/modules/core/design-system";
import { keepDocumentAction, deleteReviewedDocumentAction } from "../actions";

export const metadata: Metadata = { title: "בדיקת שמירת מסמכים" };

const df = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function RetentionReviewPage() {
  const tdb = await getTherapistDb();
  const docs = await listRetentionReview(tdb);

  return (
    <div className="max-w-3xl space-y-5">
      <header className="space-y-1">
        <Link
          href="/t/documents"
          className="text-ink-faint hover:text-ink flex items-center gap-1 text-[13px]"
        >
          <Icon name="chevron" size={14} /> למסמכים
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          בדיקת שמירת מסמכים
        </h1>
        <p className="text-ink-soft text-sm">
          מסמכים שעברו שנה. לכל אחד: <b>מחיקה</b> (הקובץ נמחק לצמיתות) או <b>שמירה</b> (נבדוק שוב
          בעוד {RETENTION_DEFER_DAYS} ימים). מסמכים רפואיים עשויים להיות כפופים לחובת שמירה — ההחלטה
          באחריות המטפלת.
        </p>
      </header>

      {docs.length === 0 ? (
        <EmptyState
          icon="doc"
          title="אין מסמכים לבדיקה"
          description="כשמסמך יעבור שנה, הוא יופיע כאן להחלטה."
        />
      ) : (
        <Card className="divide-line-soft divide-y p-0">
          {docs.map((d) => (
            <div key={d.id} className="flex flex-wrap items-center gap-3 px-3.5 py-3">
              <Icon name="doc" size={18} className="text-ink-faint shrink-0" />
              <div className="min-w-0 flex-1">
                <a
                  href={`/api/documents/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold hover:underline"
                >
                  {d.name}
                </a>
                <p className="text-ink-faint flex flex-wrap gap-x-2 text-[11px]">
                  <Link href={`/t/patients/${d.patientId}`} className="hover:underline">
                    {d.patientName}
                  </Link>
                  <span>· {DOCUMENT_KIND_LABEL[d.kind]}</span>
                  <span>· {humanSize(d.size)}</span>
                  <span>· הועלה {df.format(d.createdAt)}</span>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={keepDocumentAction.bind(null, d.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    שמירה
                  </Button>
                </form>
                <form action={deleteReviewedDocumentAction.bind(null, d.id)}>
                  <Button type="submit" variant="ghost" size="sm" className="text-danger">
                    מחיקה
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
