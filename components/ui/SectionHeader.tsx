import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Icon rendered inside a small colored circle to the left of the title. */
  icon?: ReactNode;
  /** Background/text classes for the icon circle, e.g. "bg-indigo-50 text-indigo-600". Defaults to the primary tint. */
  iconClassName?: string;
  /**
   * Heading level for `title`. Defaults to h2, since PageHeader owns the
   * page's single h1 — pass "h3" (or lower) when nesting a SectionHeader
   * inside another section that already used h2.
   */
  as?: ElementType;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  actions,
  icon,
  iconClassName,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "border-border/70 flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "bg-primary-subtle text-primary-subtle-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              iconClassName
            )}
          >
            {icon}
          </span>
        )}
        <div className="flex flex-col gap-1">
          <Heading className="text-foreground text-lg font-semibold tracking-tight">
            {title}
          </Heading>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
