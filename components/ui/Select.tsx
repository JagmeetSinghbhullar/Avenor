import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  /**
   * Convenience for the common flat case. For grouped options (<optgroup>)
   * or anything else the flat shape can't express, omit this and pass
   * <option>/<optgroup> children directly instead.
   */
  options?: SelectOption[];
}

/**
 * Wraps the native <select> rather than building a custom listbox —
 * native selects come with full keyboard and screen-reader support for
 * free, which a hand-built dropdown would have to reimplement correctly.
 * The chevron is purely decorative (aria-hidden) and sits on top of the
 * native control, which still handles all interaction.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, required, id, options, className, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;
    const describedBy = error ? errorId : hint ? hintId : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-foreground text-sm font-medium">
            {label}
            {required && (
              <span aria-hidden="true" className="text-danger ml-0.5">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            className={cn(
              "border-border bg-surface text-foreground h-10 w-full appearance-none rounded-lg border px-3 pr-9 text-sm",
              "transition-colors duration-150",
              "hover:border-border-strong",
              "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-danger focus-visible:ring-danger",
              className
            )}
            {...props}
          >
            {options
              ? options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))
              : children}
          </select>
          <svg
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M5.5 7.5 10 12l4.5-4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
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

Select.displayName = "Select";
