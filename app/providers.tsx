"use client";

import { Direction } from "radix-ui";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

/**
 * Client-side providers wrapping the whole app:
 * - Direction: makes Radix popovers / menus / sliders position correctly in RTL.
 * - TooltipProvider: required once for shadcn tooltips.
 * - Toaster: sonner mount point for toast().
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Direction.Provider dir="rtl">
      <TooltipProvider>
        {children}
        <Toaster position="top-center" dir="rtl" />
      </TooltipProvider>
    </Direction.Provider>
  );
}
