"use client";

import { Icon } from "@/modules/core/design-system";
import { logoutAction } from "./session-actions";

export function LogoutButton({ variant = "icon" }: { variant?: "icon" | "row" }) {
  if (variant === "row") {
    return (
      <form action={logoutAction}>
        <button
          type="submit"
          className="text-danger bg-surface-2 flex w-full items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-semibold"
        >
          <Icon name="status" size={19} />
          יציאה
        </button>
      </form>
    );
  }
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="יציאה"
        className="text-ink-faint hover:bg-sage-tint hover:text-ink grid size-9 place-items-center rounded-lg transition-colors md:size-8"
      >
        <Icon name="status" size={20} className="md:size-[18px]" />
      </button>
    </form>
  );
}
