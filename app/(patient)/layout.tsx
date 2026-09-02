import { requirePatient, getDisplayName } from "@/modules/core/auth/server";
import { PatientShell } from "@/modules/core/design-system";
import { PushToggle } from "@/modules/core/push/push-toggle";
import { LogoutButton } from "../logout-button";
import { NotificationBell } from "../notification-bell";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePatient();
  const name = await getDisplayName(session);

  return (
    <PatientShell
      user={{ name }}
      headerSlot={
        <>
          <NotificationBell />
          <LogoutButton />
        </>
      }
      pushSlot={<PushToggle />}
      logoutSlot={<LogoutButton variant="row" />}
    >
      {children}
    </PatientShell>
  );
}
