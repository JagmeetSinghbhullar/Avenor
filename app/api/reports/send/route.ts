import { NextResponse } from "next/server";
import { buildReportText } from "@/features/report/lib/buildReportText";
import { SlackService, SlackServiceError } from "@/services/slack.service";
import { SupabaseService, SupabaseServiceError } from "@/services/supabase.service";
import type { ReportContent } from "@/types/report";

/**
 * The only caller of SupabaseService/SlackService for reports. Saves
 * first, then sends to Slack — saving is the durable step, so a Slack
 * failure shouldn't lose the report, but a save failure should stop
 * before anything is posted publicly.
 */
export async function POST(request: Request) {
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
    const supabase = new SupabaseService();
    await supabase.saveReport({
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
    const slack = new SlackService();
    await slack.sendMessage(slackText);
  } catch (error) {
    const message =
      error instanceof SlackServiceError ? error.message : "Unexpected error sending to Slack.";
    return NextResponse.json({
      success: true,
      warning: `Report saved, but sending to Slack failed: ${message}`,
    });
  }

  return NextResponse.json({ success: true });
}
