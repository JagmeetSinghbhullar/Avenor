import { cn } from "@/lib/cn";

export type LoadingSpinnerSize = "sm" | "md" | "lg";

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  label?: string;
  className?: string;
}

const sizeStyles: Record<LoadingSpinnerSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

/**
 * `role="status"` announces the loading state to screen readers without
 * needing focus; the SVG itself is decorative (aria-hidden) and the
 * visually-hidden text is what actually gets read out.
 */
export function LoadingSpinner({ size = "md", label = "Loading", className }: LoadingSpinnerProps) {
  return (
    <span role="status" className="inline-flex">
      <svg
        aria-hidden="true"
        className={cn("text-muted-foreground animate-spin", sizeStyles[size], className)}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
