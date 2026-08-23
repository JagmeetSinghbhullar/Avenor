import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/cn";

export interface SummaryCardProps {
  label: string;
  value: ReactNode;
  /** Small helper text under the value, e.g. "Current status in DEV, STAGE or PROD verified". */
  description?: ReactNode;
  icon?: ReactNode;
  /** Background/text classes for the icon's colored circle, e.g. "bg-violet-50 text-violet-600". */
  iconClassName?: string;
  isLoading?: boolean;
  className?: string;
}

export function SummaryCard({
  label,
  value,
  description,
  icon,
  iconClassName,
  isLoading = false,
  className,
}: SummaryCardProps) {
  return (
    <Card
      className={cn(
        "hover:border-border-strong flex flex-col gap-3 p-4 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              iconClassName ?? "bg-primary-subtle text-primary-subtle-foreground"
            )}
          >
            {icon}
          </span>
        )}
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
      </div>
      {isLoading ? (
        <LoadingSpinner size="sm" label={`Loading ${label}`} />
      ) : (
        <span className="text-foreground text-2xl font-semibold tracking-tight">{value}</span>
      )}
      {description && <span className="text-muted-foreground text-xs">{description}</span>}
    </Card>
  );
}
