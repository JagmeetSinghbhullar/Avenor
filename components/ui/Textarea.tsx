import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, id, rows = 4, className, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const hintId = `${textareaId}-hint`;
    const errorId = `${textareaId}-error`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-foreground text-sm font-medium">
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "border-border bg-surface text-foreground rounded-lg border px-3 py-2.5 text-sm leading-relaxed",
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

Textarea.displayName = "Textarea";
