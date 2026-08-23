import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  UserIntegrationsService,
  UserIntegrationsServiceError,
} from "@/services/user-integrations.service";

interface SaveYouTrackBody {
  baseUrl?: string;
  apiToken?: string;
  project?: string;
  stateField?: string;
  login?: string;
}

/**
 * Connect/update YouTrack. Does not implement anything related to
 * actually syncing tickets with these credentials — that's a later step.
 * This route only ever writes to Vault via the RPC functions; it never
 * reads a decrypted token back.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: SaveYouTrackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const baseUrlInput = body.baseUrl?.trim();
  const apiToken = body.apiToken?.trim();
  const project = body.project?.trim();
  const login = body.login?.trim();
  const stateField = body.stateField?.trim() ?? "";

  if (!baseUrlInput || !project || !login) {
    return NextResponse.json(
      { error: "Base URL, Project, and YouTrack Login are all required." },
      { status: 400 }
    );
  }

  let baseUrl: string;
  try {
    baseUrl = new URL(baseUrlInput).origin;
  } catch {
    return NextResponse.json({ error: "Base URL must be a valid URL." }, { status: 400 });
  }

  const service = new UserIntegrationsService(supabase, user.id);

  try {
    if (!apiToken) {
      const existing = await service.getYouTrackStatus();
      if (!existing.connected) {
        return NextResponse.json(
          { error: "API Token is required to connect YouTrack for the first time." },
          { status: 400 }
        );
      }
    }

    await service.saveYouTrackIntegration({ baseUrl, project, stateField, login, apiToken });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserIntegrationsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error saving YouTrack integration", error);
    return NextResponse.json(
      { error: "Unexpected error saving YouTrack integration." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  try {
    const service = new UserIntegrationsService(supabase, user.id);
    await service.disconnectYouTrack();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserIntegrationsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error disconnecting YouTrack", error);
    return NextResponse.json({ error: "Unexpected error disconnecting YouTrack." }, { status: 500 });
  }
}
