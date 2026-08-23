import { BadgeCheck } from "lucide-react";

export function Topbar() {
  return (
    <header className="border-border bg-surface flex h-14 shrink-0 items-center gap-2.5 border-b px-4 md:px-6">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <BadgeCheck className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="text-foreground text-base font-semibold tracking-tight">Avenor</span>
    </header>
  );
}
