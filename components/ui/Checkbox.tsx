import { forwardRef, useEffect, useId, useRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  /**
   * Sets the native `.indeterminate` DOM property (there is no HTML
   * attribute for it — it must be set imperatively). Intended for a
   * parent-flow checkbox that reflects "some but not all children
   * selected" once the Tested Flows tree UI is built.
   */
  indeterminate?: boolean;
  /** Keeps `label` in the accessibility tree but visually hides it — for compact contexts (e.g. a table row) that need an accessible name without visible text. */
  hideLabel?: boolean;
}

/**
 * The real <input type="checkbox"> stays in the document (not display:none)
 * so it's still focusable, clickable, and announced correctly by screen
 * readers — it's just visually hidden (`sr-only`) with a styled decorative
 * box taking its place, driven entirely by CSS `peer-*` variants off the
 * input's :checked / :indeterminate / :focus-visible / :disabled state.
 * Wrapping both in a single <label> gives native click-through so clicking
 * the visual box (or the label text) toggles the real input.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      indeterminate = false,
      hideLabel = false,
      id,
      className,
      disabled,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const checkboxId = id ?? generatedId;
    const descriptionId = `${checkboxId}-description`;
    const errorId = `${checkboxId}-error`;
    const describedBy = error ? errorId : description ? descriptionId : undefined;

    useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const setRefs = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
    };

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            "group inline-flex cursor-pointer items-start gap-2.5",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
            <input
              ref={setRefs}
              type="checkbox"
              id={checkboxId}
              disabled={disabled}
              aria-invalid={!!error || undefined}
              aria-describedby={describedBy}
              className={cn("peer sr-only", className)}
              {...props}
            />
            <span
              aria-hidden="true"
              className={cn(
                "border-border-strong bg-surface absolute inset-0 rounded-[5px] border transition-colors duration-150",
                "group-hover:border-primary/60",
                "peer-checked:border-primary peer-checked:bg-primary",
                "peer-indeterminate:border-primary peer-indeterminate:bg-primary",
                "peer-focus-visible:ring-ring peer-focus-visible:ring-offset-background peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2",
                error && "border-danger"
              )}
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              fill="none"
              className="text-primary-foreground relative h-3 w-3 opacity-0 transition-opacity duration-150 peer-checked:opacity-100"
            >
              <path
                d="M2.5 6.5 5 9l4.5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 12 12"
              fill="none"
              className="text-primary-foreground absolute h-3 w-3 opacity-0 transition-opacity duration-150 peer-indeterminate:opacity-100"
            >
              <path d="M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <span className={cn("flex flex-col gap-0.5 text-sm", hideLabel && "sr-only")}>
            <span className="text-foreground font-medium">{label}</span>
            {description && <span className="text-muted-foreground">{description}</span>}
          </span>
        </label>
        {error && (
          <p id={errorId} role="alert" className="text-danger ml-6.5 text-xs">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
