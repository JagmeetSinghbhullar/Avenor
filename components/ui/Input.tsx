import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, id, className, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-foreground text-sm font-medium">
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            )}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "border-border bg-surface text-foreground h-10 rounded-lg border px-3 text-sm",
            "transition-colors duration-150",
            "placeholder:text-muted-foreground/70",
            "hover:border-border-strong",
            "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-danger focus-visible:ring-danger",
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-muted-foreground text-xs">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-danger text-xs">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
