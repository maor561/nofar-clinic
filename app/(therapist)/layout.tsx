import { requireTherapist, getDisplayName } from "@/modules/core/auth/server";
import { TherapistShell } from "@/modules/core/design-system";
import { LogoutButton } from "../logout-button";

export default async function TherapistLayout({ children }: { children: React.ReactNode }) {
  const session = await requireTherapist();
  const name = await getDisplayName(session);

  return (
    <TherapistShell user={{ name, role: "נטורופתית · מנהלת" }} headerSlot={<LogoutButton />}>
      {children}
    </TherapistShell>
  );
}
