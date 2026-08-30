import { requirePatient, getDisplayName } from "@/modules/core/auth/server";
import { PatientShell } from "@/modules/core/design-system";
import { LogoutButton } from "../logout-button";
import { NotificationBell } from "../notification-bell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePatient();
  const name = await getDisplayName(session);

  return (
    <PatientShell
      user={{ name }}
      headerSlot={
        <div className="flex items-center gap-1">
          <NotificationBell />
          <LogoutButton />
        </div>
      }
    >
      {children}
    </PatientShell>
  );
}
