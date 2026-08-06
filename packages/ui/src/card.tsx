import type { ReactNode } from "react";
import { cn } from "@aikitr-desktop/utils";

export interface UiCardProps {
  className?: string;
  children?: ReactNode;
}

export function UiCard({ className, children }: UiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
