import type { ReactNode } from "react";
import { Toaster } from "@aikitr-desktop/ui/components/toast";
import { TooltipProvider } from "@aikitr-desktop/ui/components/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <Toaster>{children}</Toaster>
    </TooltipProvider>
  );
}
