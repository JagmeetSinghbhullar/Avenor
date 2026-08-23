import DashboardClient from "@/app/(dashboard)/DashboardClient";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserStatus } from "@/lib/user-status";
import { SupabaseService } from "@/services/supabase.service";

/**
 * Thin Server Component wrapper — DashboardLayout already guarantees
 * YouTrack is connected by the time this renders (redirects to
 * /onboarding otherwise), so youtrackConnected is defensive here rather
 * than load-bearing: it protects DashboardClient against a stale client
 * session (e.g. YouTrack disconnected in another tab) without relying on
 * a fresh full-page navigation to catch it. getCurrentUserStatus() is
 * cache()-wrapped, so this doesn't cost a second database round trip on
 * top of the layout's own call.
 *
 * The report draft is loaded here too (rather than fetched client-side)
 * so a returning user's in-progress report is restored on first paint,
 * with no loading flash and no risk of racing the autosave effect.
 */
export default async function DashboardPage() {
  const status = await getCurrentUserStatus();

  const supabase = await createClient();
  const supabaseService = new SupabaseService(supabase);
  // Failing to load a draft (e.g. report_drafts migration not applied
  // yet) shouldn't take down the whole dashboard — worst case, the user
  // just starts from a blank report instead of a restored one.
  const draft = status
    ? await supabaseService.getReportDraft(status.userId).catch((error: unknown) => {
        console.error("Failed to load report draft", error);
        return null;
      })
    : null;

  return (
    <DashboardClient
      slackConnected={status?.slackConnected ?? false}
      youtrackConnected={status?.youtrackConnected ?? false}
      initialDraft={draft ?? undefined}
    />
  );
}
