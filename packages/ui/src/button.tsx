import type { ComponentProps } from "react";
import { Button } from "./components/button";

export type UiButtonVariant = NonNullable<
  ComponentProps<typeof Button>["variant"]
>;
export type UiButtonSize = "sm" | "md" | "lg" | "icon";
export type UiButtonProps = Omit<ComponentProps<typeof Button>, "size"> & {
  size?: UiButtonSize;
};

/** Compatibility entry point. Base UI composition uses render, not asChild. */
export function UiButton({ size = "md", ...props }: UiButtonProps) {
  return <Button size={size === "md" ? "default" : size} {...props} />;
}
