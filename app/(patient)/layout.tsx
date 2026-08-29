import { requirePatient, getDisplayName } from "@/modules/core/auth/server";
import { PatientShell } from "@/modules/core/design-system";
import { LogoutButton } from "../logout-button";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePatient();
  const name = await getDisplayName(session);

  return (
    <PatientShell user={{ name }} headerSlot={<LogoutButton />}>
      {children}
    </PatientShell>
  );
}
