import type { Metadata } from "next";
import Link from "next/link";
import { getTherapistDb } from "@/modules/core/authz/server";
import { listRecentDocuments, DOCUMENT_KIND_LABEL } from "@/modules/documents";
import { listPatients } from "@/modules/patients";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Icon,
} from "@/modules/core/design-system";
import { ShareForm } from "./share-form";

export const metadata: Metadata = { title: "מסמכים" };

const df = new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" });

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default async function AllDocumentsPage() {
  const tdb = await getTherapistDb();
  const [docs, patients] = await Promise.all([
    listRecentDocuments(tdb),
    listPatients(tdb, { status: "active", limit: 200 }),
  ]);
  const patientOptions = patients.map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
  }));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">מסמכים</h1>
        <p className="text-ink-soft text-sm">
          כל המסמכים לפי סדר העלאה. להעלאה לתיק יחיד — דרך תיק המטופל/ת.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>שליחת מסמך למספר מטופלים</CardTitle>
        </CardHeader>
        <CardContent>
          <ShareForm patients={patientOptions} />
        </CardContent>
      </Card>

      {docs.length === 0 ? (
        <EmptyState
          icon="doc"
          title="אין מסמכים עדיין"
          description="העלו מסמך ראשון מתוך תיק של מטופל/ת."
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
                  <Link href={`/t/patients/${d.patientId}`} className="hover:underline">
                    {d.patientName}
                  </Link>
                  <span>· {DOCUMENT_KIND_LABEL[d.kind]}</span>
                  <span>· {humanSize(d.size)}</span>
                  <span>· {df.format(d.createdAt)}</span>
                </p>
              </div>
              <span
                className={
                  d.visibility === "therapist_and_patient"
                    ? "text-sage-deep text-[11px] font-semibold"
                    : "text-ink-faint text-[11px] font-semibold"
                }
              >
                {d.visibility === "therapist_and_patient" ? "משותף" : "פנימי"}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
