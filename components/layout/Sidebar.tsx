"use client";

import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/cn";

const NAV_ICONS = { "/dashboard": Home, "/profile": User } as const;

/** Hidden below md — mobile relies on the Topbar alone for now (see PageHeader spec: mobile polish is a later pass). */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border bg-surface hidden w-56 shrink-0 border-r md:block">
      <nav className="flex flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = NAV_ICONS[item.href as keyof typeof NAV_ICONS];
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-primary-subtle text-primary-subtle-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
