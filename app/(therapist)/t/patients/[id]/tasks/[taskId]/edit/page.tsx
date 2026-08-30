import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getTask } from "@/modules/tasks";
import { TaskForm } from "../../task-form";
import { updateTaskAction } from "../../actions";

export const metadata: Metadata = { title: "עריכת משימה — נופר" };

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string; taskId: string }>;
}) {
  const { id, taskId } = await params;
  const tdb = await getTherapistDb();
  const t = await getTask(tdb, taskId);
  if (!t || t.patientId !== id) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}/tasks`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה למשימות
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">עריכת משימה</h1>
      <TaskForm
        action={updateTaskAction.bind(null, taskId, id)}
        submitLabel="שמירה"
        values={{
          title: t.title,
          description: t.description,
          startDate: t.startDate,
          endDate: t.endDate,
          frequency: t.frequency,
        }}
      />
    </div>
  );
}
