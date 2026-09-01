import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTherapistDb } from "@/modules/core/authz/server";
import { getPatient } from "@/modules/patients";
import { TaskForm } from "../task-form";
import { createTaskAction } from "../actions";

export const metadata: Metadata = { title: "משימה חדשה" };

export default async function NewTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tdb = await getTherapistDb();
  const p = await getPatient(tdb, id);
  if (!p) notFound();

  return (
    <div className="space-y-5">
      <Link
        href={`/t/patients/${id}/tasks`}
        className="text-sage-deep text-sm font-semibold hover:underline"
      >
        ← חזרה למשימות
      </Link>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        משימה חדשה · {p.firstName} {p.lastName}
      </h1>
      <TaskForm action={createTaskAction.bind(null, id)} submitLabel="יצירת משימה" />
    </div>
  );
}
