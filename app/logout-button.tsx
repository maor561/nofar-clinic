"use client";

import { Icon } from "@/modules/core/design-system";
import { logoutAction } from "./session-actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="יציאה"
        className="text-ink-faint hover:bg-sage-tint hover:text-ink grid size-8 place-items-center rounded-lg transition-colors"
      >
        <Icon name="status" size={18} />
      </button>
    </form>
  );
}
