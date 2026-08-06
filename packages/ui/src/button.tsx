import type { ButtonHTMLAttributes } from "react";
import { cn } from "@aikitr-desktop/utils";
import { forwardRef } from "react";

// ─────────────────────────────────────────────────────────
// UiButton
// ─────────────────────────────────────────────────────────

export type UiButtonVariant = "default" | "outline" | "ghost" | "destructive";
export type UiButtonSize = "sm" | "md" | "lg" | "icon";

export interface UiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: UiButtonVariant;
  size?: UiButtonSize;
  asChild?: boolean;
}

const VARIANT: Record<UiButtonVariant, string> = {
  default:
    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  outline:
    "border border-border bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
};

const SIZE: Record<UiButtonSize, string> = {
  sm: "h-8 rounded-md px-3 text-xs",
  md: "h-10 rounded-md px-4 text-sm",
  lg: "h-11 rounded-md px-6 text-base",
  icon: "h-10 w-10 rounded-md",
};

/**
 * 基础按钮组件（shadcn Button 简化版，不依赖 Radix 以快速可跑）
 * 后续步骤 5 安装 shadcn 后会替换为完整实现。
 */
export const UiButton = forwardRef<HTMLButtonElement, UiButtonProps>(
  function UiButton(
    { className, variant = "default", size = "md", type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          VARIANT[variant as UiButtonVariant],
          SIZE[size as UiButtonSize],
          className,
        )}
        {...props}
      />
    );
  },
);
