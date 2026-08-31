import type { Metadata } from "next";
import { getPatientDb } from "@/modules/core/authz/server";
import { listDocuments, DOCUMENT_KIND_LABEL } from "@/modules/documents";
import { Card, EmptyState, Icon } from "@/modules/core/design-system";
import { UploadForm } from "@/app/(therapist)/t/patients/[id]/documents/upload-form";
import { uploadDocumentAction } from "@/app/(therapist)/t/patients/[id]/documents/actions";

export const metadata: Metadata = { title: "מסמכים — נופר" };

const df = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function MyDocumentsPage() {
  const pdb = await getPatientDb();
  const me = await pdb.self();
  if (!me) return null;

  const docs = await listDocuments(pdb, me.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">מסמכים</h1>
        <p className="text-ink-soft text-sm">מסמכים ששיתפה איתך נופר, וקבצים שתעלה/י עבורה.</p>
      </header>

      <UploadForm action={uploadDocumentAction.bind(null, me.id)} />

      {docs.length === 0 ? (
        <EmptyState
          icon="doc"
          title="אין מסמכים"
          description="כשנופר תשתף מסמך, הוא יופיע כאן. גם קבצים שתעלה/י יופיעו."
        />
      ) : (
        <Card className="divide-line-soft divide-y p-0">
          {docs.map((d) => (
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
                  <span>· {d.uploadedBy === "patient" ? "הועלה על ידך" : "מנופר"}</span>
                  <span>· {df.format(d.createdAt)}</span>
                </p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
