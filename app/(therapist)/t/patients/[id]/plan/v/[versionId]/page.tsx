import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPlanVersion } from "@/modules/plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/core/design-system";

export const metadata: Metadata = { title: "גרסת תוכנית" };

const dtf = new Intl.DateTimeFormat("he-IL", { dateStyle: "long", timeStyle: "short" });

export default async function PlanVersionPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const { id, versionId } = await params;
  const tdb = await getTherapistDb();
  const version = await getPlanVersion(tdb, versionId);
  if (!version || version.patientId !== id) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}/plan`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה לתוכנית הנוכחית
      </Link>
      <header className="border-line border-b pb-3">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          תוכנית טיפול · גרסה {version.versionNo}
        </h1>
        <p className="text-ink-soft mt-1 text-sm">
          {dtf.format(version.createdAt)}
          {version.note && <> · {version.note}</>}
        </p>
      </header>

      {version.fields.length === 0 ? (
        <p className="text-ink-faint text-sm">גרסה ריקה.</p>
      ) : (
        <div className="max-w-2xl space-y-4">
          {version.fields.map((f) => (
            <Card key={f.definitionId}>
              <CardHeader>
                <CardTitle>{f.labelHe}</CardTitle>
              </CardHeader>
              <CardContent className="text-ink text-sm whitespace-pre-wrap">
                {String(f.value ?? "").trim() || "—"}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
