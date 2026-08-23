import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { TopbarUser } from "@/components/layout/Topbar";
import { getCurrentUserStatus } from "@/lib/user-status";

/**
 * Shares AppShell with the dashboard layout but deliberately has ONLY
 * the sign-in gate, not the YouTrack-connected gate — this is exactly
 * the page a user without YouTrack connected needs to reach (onboarding
 * links here), so it can never require YouTrack itself without creating
 * a redirect loop.
 */
export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const status = await getCurrentUserStatus();

  if (!status) {
    redirect("/login");
  }

  const topbarUser: TopbarUser = {
    name: status.name,
    email: status.email,
    avatarUrl: status.avatarUrl,
  };

  return <AppShell user={topbarUser}>{children}</AppShell>;
}
