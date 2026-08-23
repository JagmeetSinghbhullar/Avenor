import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Renders a small leading status dot (e.g. for ticket/environment status). */
  dot?: boolean;
}

/**
 * Uses the "subtle" token pairs (light tint background + dark, readable
 * text) rather than solid saturated fills. Subtle badges read as
 * informational rather than alarming and are easier to keep accessible —
 * see the contrast notes in styles/tokens.css.
 */
const variantStyles: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-subtle text-primary-subtle-foreground",
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
  danger: "bg-danger-subtle text-danger-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
};

const dotStyles: Record<BadgeVariant, string> = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

export function Badge({
  variant = "neutral",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])} />
      )}
      {children}
    </span>
  );
}
