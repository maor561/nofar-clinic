import { requireTherapist, getDisplayName } from "@/modules/core/auth/server";
import { TherapistShell } from "@/modules/core/design-system";
import { LogoutButton } from "../logout-button";
import { NotificationBell } from "../notification-bell";

export default async function TherapistLayout({ children }: { children: React.ReactNode }) {
  const session = await requireTherapist();
  const name = await getDisplayName(session);

  return (
    <TherapistShell
      user={{ name, role: "נטורופתית · מנהלת" }}
      headerSlot={
        <div className="flex items-center gap-1">
          <NotificationBell />
          <LogoutButton />
        </div>
      }
    >
      {children}
    </TherapistShell>
  );
}
