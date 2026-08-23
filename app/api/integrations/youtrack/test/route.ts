import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { YouTrackService, YouTrackServiceError } from "@/services/youtrack.service";

interface TestYouTrackBody {
  baseUrl?: string;
  project?: string;
  login?: string;
  apiToken?: string;
}

/**
 * Verifies a set of YouTrack credentials without saving them anywhere —
 * the token here is only ever held in memory for the duration of this
 * request, never written to Supabase/Vault or logged.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: TestYouTrackBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const baseUrlInput = body.baseUrl?.trim();
  const project = body.project?.trim();
  const login = body.login?.trim();
  const apiToken = body.apiToken?.trim();

  if (!baseUrlInput || !project || !login || !apiToken) {
    return NextResponse.json(
      { error: "Base URL, Project, Login, and API Token are all required to test." },
      { status: 400 }
    );
  }

  let baseUrl: string;
  try {
    baseUrl = new URL(baseUrlInput).origin;
  } catch {
    return NextResponse.json({ error: "Base URL must be a valid URL." }, { status: 400 });
  }

  try {
    const youtrack = new YouTrackService({ baseUrl, apiToken, projectId: project });
    await youtrack.testConnection(login);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof YouTrackServiceError ? error.message : "Connection test failed.";
    return NextResponse.json({ success: false, error: message });
  }
}
