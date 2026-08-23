import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar, type TopbarUser } from "@/components/layout/Topbar";

export interface AppShellProps {
  user: TopbarUser;
  children: ReactNode;
}

/**
 * Pure presentation — Topbar + Sidebar + main content wrapper, no auth
 * logic at all. Extracted so routes with different gating requirements
 * (the dashboard requires YouTrack connected; /profile only requires
 * being signed in, since it's where YouTrack gets connected) can share
 * the same chrome without sharing the same redirect rules.
 */
export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Topbar user={user} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
