import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserIntegrationsService, UserIntegrationsServiceError } from "@/services/user-integrations.service";
import { YouTrackService, YouTrackServiceError, isDevFallbackConfigured } from "@/services/youtrack.service";

/**
 * The only place YouTrackService is ever called from. It needs the
 * caller's decrypted API token, which must never reach the browser, so
 * client code (the Sync button, the dashboard) calls this route instead
 * of the service directly.
 *
 * Credentials always come from the signed-in user's own user_integrations
 * row (RLS + get_youtrack_token() both re-scope to auth.uid() regardless
 * of what's passed around in JS, so one user's session structurally
 * cannot resolve another user's token). The YOUTRACK_* env vars are only
 * ever used as a whole-project, unscoped fallback for local development
 * when a user hasn't connected their own YouTrack yet — never mixed
 * field-by-field with a real per-user config, and never used at all in
 * production.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const integrationsService = new UserIntegrationsService(supabase, user.id);

  let credentials;
  try {
    credentials = await integrationsService.getYouTrackCredentialsForSync();
  } catch (error) {
    if (error instanceof UserIntegrationsServiceError) {
      console.error("YouTrack sync: failed to resolve credentials", error.message, error.cause);
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("YouTrack sync: unexpected error resolving credentials", error);
    return NextResponse.json(
      { error: "Unexpected error reading your YouTrack integration." },
      { status: 500 }
    );
  }

  let service: YouTrackService;
  let login: string | undefined;

  if (credentials) {
    service = new YouTrackService({
      baseUrl: credentials.baseUrl,
      apiToken: credentials.apiToken,
      projectId: credentials.project,
      stateFieldName: credentials.stateField,
    });
    login = credentials.login;
  } else if (process.env.NODE_ENV !== "production" && isDevFallbackConfigured()) {
    // No per-user integration yet — fall back to the shared env-based
    // config for local development convenience only. This path never
    // scopes by login (there isn't one), matching its original
    // whole-project behavior.
    service = new YouTrackService();
    login = undefined;
  } else {
    return NextResponse.json(
      { error: "YouTrack is not connected. Connect it in Profile to start syncing." },
      { status: 400 }
    );
  }

  try {
    const result = await service.sync(login);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof YouTrackServiceError) {
      console.error("YouTrack sync failed:", error.message, {
        status: error.status,
        cause: error.cause,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error during YouTrack sync", error);
    return NextResponse.json(
      { error: "Unexpected server error during YouTrack sync." },
      { status: 500 }
    );
  }
}
