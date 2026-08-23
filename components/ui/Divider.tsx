import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  label?: ReactNode;
  className?: string;
}

export function Divider({ orientation = "horizontal", label, className }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn("bg-border h-full w-px self-stretch", className)}
      />
    );
  }

  if (!label) {
    return <hr className={cn("border-border/80 border-t", className)} />;
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn("flex items-center gap-3", className)}
    >
      <span className="bg-border/80 h-px flex-1" />
      <span className="text-muted-foreground text-xs font-medium tracking-wide">{label}</span>
      <span className="bg-border/80 h-px flex-1" />
    </div>
  );
}
