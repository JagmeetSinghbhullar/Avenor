import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  UserIntegrationsService,
  UserIntegrationsServiceError,
} from "@/services/user-integrations.service";

/** Connect/update the caller's own Slack Incoming Webhook. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: { webhookUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const webhookUrl = body.webhookUrl?.trim();
  if (!webhookUrl) {
    return NextResponse.json({ error: "Webhook URL is required." }, { status: 400 });
  }

  try {
    new URL(webhookUrl);
  } catch {
    return NextResponse.json({ error: "Webhook URL must be a valid URL." }, { status: 400 });
  }

  try {
    const service = new UserIntegrationsService(supabase, user.id);
    await service.saveSlackWebhook(webhookUrl);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserIntegrationsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error saving Slack integration", error);
    return NextResponse.json(
      { error: "Unexpected error saving Slack integration." },
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
    await service.disconnectSlack();
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserIntegrationsServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error disconnecting Slack", error);
    return NextResponse.json({ error: "Unexpected error disconnecting Slack." }, { status: 500 });
  }
}
