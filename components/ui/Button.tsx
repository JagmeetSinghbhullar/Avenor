import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-all duration-150 ease-out active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg",
  secondary: "bg-muted text-foreground hover:bg-border",
  outline:
    "border border-border bg-transparent text-foreground hover:border-border-strong hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
  destructive: "bg-danger text-danger-foreground shadow-sm hover:bg-danger-hover hover:shadow-md",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

/**
 * `type="button"` is the default (not the native "submit") so a Button
 * dropped anywhere inside a <form> doesn't accidentally submit it unless
 * the caller explicitly opts in with type="submit".
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      type = "button",
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size="sm" label="Loading" className="text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
