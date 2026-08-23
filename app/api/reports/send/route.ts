import { NextResponse } from "next/server";
import { buildReportText } from "@/features/report/lib/buildReportText";
import { createClient } from "@/lib/supabase/server";
import { SlackService, SlackServiceError } from "@/services/slack.service";
import { SupabaseService, SupabaseServiceError } from "@/services/supabase.service";
import { UserIntegrationsService, UserIntegrationsServiceError } from "@/services/user-integrations.service";
import type { ReportContent } from "@/types/report";

/**
 * The only caller of SupabaseService/SlackService for reports. Saves
 * first, then sends to Slack — saving is the durable step, so a Slack
 * failure (including "not connected") shouldn't lose the report, but a
 * save failure should stop before anything is posted publicly.
 *
 * The webhook always comes from the signed-in user's own Vault-stored
 * secret (via get_slack_webhook(), re-scoped to auth.uid() regardless of
 * what's passed around in JS) — never a shared/env webhook, so one
 * user's report can never be posted to another user's Slack channel.
 *
 * proxy.ts already blocks unauthenticated requests to this route (see
 * Step 1), but this route also checks the session itself and returns a
 * proper 401 JSON response rather than relying solely on that — the
 * "known rough edge" flagged after Step 1 (an unauthenticated hit on an
 * API route got redirected to /login as HTML instead of a clean error) is
 * fixed here specifically, since this route now needs the session for
 * user_id anyway.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let content: ReportContent;
  try {
    const body: { content?: ReportContent } = await request.json();
    if (!body.content) {
      return NextResponse.json({ error: "Missing report content." }, { status: 400 });
    }
    content = body.content;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!content.buildNumber?.trim() || !content.environment) {
    return NextResponse.json(
      { error: "Build Number and Environment are required." },
      { status: 400 }
    );
  }

  const slackText = buildReportText(content);
  const reportDate = new Date().toISOString().slice(0, 10);

  try {
    const supabaseService = new SupabaseService(supabase);
    await supabaseService.saveReport({
      userId: user.id,
      reportDate,
      buildNumber: content.buildNumber,
      environment: content.environment,
      testedFlows: content.testedFlows,
      verifiedTickets: content.verifiedTickets,
      createdTickets: content.createdTickets,
      notes: content.notes,
      slackPayload: { text: slackText },
    });
  } catch (error) {
    if (error instanceof SupabaseServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error saving report", error);
    return NextResponse.json({ error: "Unexpected error saving the report." }, { status: 500 });
  }

  try {
    const integrationsService = new UserIntegrationsService(supabase, user.id);
    const webhookUrl = await integrationsService.getSlackWebhookForSync();
    if (!webhookUrl) {
      return NextResponse.json({
        success: true,
        warning: "Report saved, but Slack isn't connected — nothing was sent.",
      });
    }

    const slack = new SlackService(webhookUrl);
    await slack.sendMessage(slackText);
  } catch (error) {
    const message =
      error instanceof SlackServiceError || error instanceof UserIntegrationsServiceError
        ? error.message
        : "Unexpected error sending to Slack.";
    return NextResponse.json({
      success: true,
      warning: `Report saved, but sending to Slack failed: ${message}`,
    });
  }

  return NextResponse.json({ success: true });
}
