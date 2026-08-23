import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar, type TopbarUser } from "@/components/layout/Topbar";
import { createClient } from "@/lib/supabase/server";

/**
 * Shell for the dashboard and any future pages (History, Settings, ...).
 * A route group ("(dashboard)") so this layout applies without adding a
 * path segment — the dashboard page itself still lives at "/".
 *
 * A Server Component (not "use client") specifically so it can read the
 * session via lib/supabase/server.ts and hand a plain, serializable user
 * object down to Topbar — no client-side auth fetch/flash needed.
 */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const topbarUser: TopbarUser | null = authUser
    ? {
        name:
          (authUser.user_metadata.full_name as string | undefined) ??
          (authUser.user_metadata.name as string | undefined) ??
          authUser.email ??
          "Signed in",
        email: authUser.email ?? "",
        avatarUrl:
          (authUser.user_metadata.avatar_url as string | undefined) ??
          (authUser.user_metadata.picture as string | undefined) ??
          null,
      }
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <Topbar user={topbarUser} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
