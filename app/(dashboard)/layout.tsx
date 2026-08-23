import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { TopbarUser } from "@/components/layout/Topbar";
import { getCurrentUserStatus } from "@/lib/user-status";

/**
 * Shell for the dashboard specifically (not /profile — see
 * app/profile/layout.tsx, which shares AppShell but not this gate).
 * A route group ("(dashboard)") so this layout applies without adding a
 * path segment — the dashboard page itself still lives at "/".
 *
 * A Server Component (not "use client") specifically so it can read the
 * session via lib/user-status.ts and hand a plain, serializable user
 * object down to Topbar — no client-side auth fetch/flash needed.
 *
 * Two gates, both server-enforced before `children` (and therefore the
 * dashboard page's client-side YouTrack fetch) ever renders:
 *  1. No session -> /login. proxy.ts already redirects this case too;
 *     this is defense in depth for any route added under this layout
 *     without the proxy's matcher being updated.
 *  2. Signed in but YouTrack not connected -> /onboarding. This is what
 *     makes "do not fetch any YouTrack data until setup is complete" a
 *     structural guarantee rather than a UI convention — the page that
 *     calls useYouTrackSync is never reached at all. Slack is
 *     deliberately NOT part of this gate — it's optional (see the
 *     dashboard page, which disables just the Send Report action when
 *     Slack isn't connected rather than blocking the whole dashboard).
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const status = await getCurrentUserStatus();

  if (!status) {
    redirect("/login");
  }

  if (!status.youtrackConnected) {
    redirect("/onboarding");
  }

  const topbarUser: TopbarUser = {
    name: status.name,
    email: status.email,
    avatarUrl: status.avatarUrl,
  };

  return <AppShell user={topbarUser}>{children}</AppShell>;
}
