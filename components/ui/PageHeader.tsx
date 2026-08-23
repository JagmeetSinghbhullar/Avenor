import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Owns the page's single h1. Use SectionHeader for headings within the page body. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "border-border flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
