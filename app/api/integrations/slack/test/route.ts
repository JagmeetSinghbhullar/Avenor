import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SlackService, SlackServiceError } from "@/services/slack.service";

/**
 * Verifies a webhook URL by actually posting a small test message —
 * Slack Incoming Webhooks have no dry-run mode, so this is the only way
 * to confirm a URL is live. The URL is only ever held in memory for the
 * duration of this request, never written anywhere or logged.
 */
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
    const slack = new SlackService(webhookUrl);
    await slack.sendMessage("Avenor: this is a test message confirming your Slack webhook is connected.");
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof SlackServiceError ? error.message : "Connection test failed.";
    return NextResponse.json({ success: false, error: message });
  }
}
