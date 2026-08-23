import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentUserStatus {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly youtrackConnected: boolean;
  readonly slackConnected: boolean;
}

/**
 * Reads the signed-in user's profile + integration status, via the
 * caller's own session (RLS-scoped, no service-role key). Shared by the
 * dashboard layout (auth + onboarding gating) and the onboarding page
 * (which needs the exact same status to decide what to show), so the two
 * can't drift out of sync with each other.
 *
 * "Connected" for YouTrack means every field a query actually needs is
 * present, not just that a row exists — a half-filled-in integration
 * shouldn't read as ready. Returns null when there's no session at all.
 *
 * Wrapped in React's cache() so calling this from both the dashboard
 * layout and the dashboard page within the same request reuses one
 * result instead of hitting the database twice.
 */
export const getCurrentUserStatus = cache(async (): Promise<CurrentUserStatus | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [profileResult, integrationsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("user_integrations")
      .select(
        "youtrack_base_url, youtrack_api_token, youtrack_project, youtrack_login, slack_webhook"
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    console.error("getCurrentUserStatus: failed to read profile", profileResult.error);
  }
  if (integrationsResult.error) {
    console.error(
      "getCurrentUserStatus: failed to read user_integrations",
      integrationsResult.error
    );
  }

  const profile = profileResult.data;
  const integrations = integrationsResult.data;

  return {
    userId: user.id,
    email: profile?.email ?? user.email ?? "",
    name: profile?.full_name ?? user.email ?? "Signed in",
    avatarUrl: profile?.avatar_url ?? null,
    youtrackConnected: !!(
      integrations?.youtrack_base_url &&
      integrations?.youtrack_api_token &&
      integrations?.youtrack_project &&
      integrations?.youtrack_login
    ),
    slackConnected: !!integrations?.slack_webhook,
  };
});
