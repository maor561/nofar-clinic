import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatient } from "@/modules/patients";
import {
  listDocuments,
  DOCUMENT_KIND_LABEL,
  DOCUMENT_VISIBILITY_LABEL,
  type DocumentRow,
} from "@/modules/documents";
import { Card, EmptyState, Icon, cn } from "@/modules/core/design-system";
import { UploadForm } from "./upload-form";
import { uploadDocumentAction, setDocVisibilityAction, deleteDocumentAction } from "./actions";

export const metadata: Metadata = { title: "מסמכים — נופר" };

const df = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  const docs = await listDocuments(tdb, id);

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתיק
      </Link>

      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          מסמכים · {p.firstName} {p.lastName}
        </h1>
        <p className="text-ink-soft text-sm">{docs.length} מסמכים</p>
      </header>

      <UploadForm action={uploadDocumentAction.bind(null, id)} showVisibility />

      {docs.length === 0 ? (
        <EmptyState
          icon="doc"
          title="אין מסמכים"
          description="העלו בדיקות, סיכומים או הפניות. סמנו 'משותף' כדי שהמטופל/ת יראה."
        />
      ) : (
        <Card className="divide-line-soft divide-y p-0">
          {docs.map((d: DocumentRow) => (
            <div key={d.id} className="flex items-center gap-3 px-3.5 py-3">
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
                  <span>{DOCUMENT_KIND_LABEL[d.kind]}</span>
                  <span>· {humanSize(d.size)}</span>
                  <span>
                    · {d.uploadedBy === "patient" ? "הועלה ע״י המטופל/ת" : "הועלה על ידך"}
                  </span>
                  <span>· {df.format(d.createdAt)}</span>
                </p>
              </div>

              <form
                action={setDocVisibilityAction.bind(
                  null,
                  d.id,
                  id,
                  d.visibility === "therapist_only" ? "therapist_and_patient" : "therapist_only",
                )}
              >
                <button
                  type="submit"
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                    d.visibility === "therapist_and_patient"
                      ? "border-sage bg-sage-soft text-sage-deep"
                      : "border-line text-ink-faint hover:border-sage",
                  )}
                  title={DOCUMENT_VISIBILITY_LABEL[d.visibility]}
                >
                  {d.visibility === "therapist_and_patient" ? "משותף" : "פנימי"}
                </button>
              </form>

              <form action={deleteDocumentAction.bind(null, d.id, id)}>
                <button
                  type="submit"
                  className="text-ink-faint hover:text-danger p-1"
                  aria-label="מחיקה"
                >
                  <Icon name="x" size={15} />
                </button>
              </form>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
