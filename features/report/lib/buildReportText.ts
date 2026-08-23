import type { ReportContent } from "@/types/report";

/**
 * Renders a ReportContent into the exact Slack `mrkdwn` text that gets
 * sent to the webhook. Used by BOTH the live Report Preview and the
 * actual send-to-Slack API route — sharing this one function is what
 * guarantees the preview is exactly what gets sent, not just similar to it.
 */
export function buildReportText(content: ReportContent): string {
  const lines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  lines.push(`*QA Daily Report — ${today}*`);
  lines.push("");
  lines.push(`*Build:* ${content.buildNumber || "Not set"}`);
  lines.push(`*Environment:* ${content.environment || "Not set"}`);
  lines.push("");

  lines.push(`*Tested Flows (${content.testedFlows.length})*`);
  if (content.testedFlows.length === 0) {
    lines.push("_None selected_");
  } else {
    for (const flow of content.testedFlows) {
      lines.push(`• ${flow.label}${flow.isManual ? " (manual)" : ""}`);
    }
  }
  lines.push("");

  lines.push(`*Verified Tickets (${content.verifiedTickets.length})*`);
  if (content.verifiedTickets.length === 0) {
    lines.push("_None selected_");
  } else {
    for (const ticket of content.verifiedTickets) {
      lines.push(
        `• ${ticket.id} — ${ticket.summary} (${ticket.verifiedEnvironment}) — ${ticket.assignee ?? "Unassigned"}`
      );
    }
  }
  lines.push("");

  lines.push(`*Created Tickets (${content.createdTickets.length})*`);
  if (content.createdTickets.length === 0) {
    lines.push("_None selected_");
  } else {
    for (const ticket of content.createdTickets) {
      lines.push(`• ${ticket.id} — ${ticket.summary}`);
    }
  }
  lines.push("");

  lines.push("*Notes*");
  lines.push(content.notes.trim() || "_None_");

  return lines.join("\n");
}
