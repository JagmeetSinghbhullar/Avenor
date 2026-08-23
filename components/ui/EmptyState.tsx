import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-14 text-center", className)}>
      {icon && (
        <div
          aria-hidden="true"
          className="bg-primary-subtle text-primary-subtle-foreground flex h-12 w-12 items-center justify-center rounded-xl"
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-foreground text-sm font-semibold">{title}</p>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
