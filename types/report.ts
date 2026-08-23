import type { VerifiedTicket, YouTrackTicket } from "@/types/youtrack";

/**
 * Manually declared (not derived from constants/environments.ts) so this
 * file has zero runtime dependencies — same reasoning as FlowCategoryId in
 * types/flow.ts. Adding an environment means editing both this union and
 * ENVIRONMENT_OPTIONS in constants/environments.ts.
 */
export type Environment = "Development" | "Staging" | "Production" | "Sandbox" | "Local";

/** A tested flow as it will appear in the report — catalog or manual, already resolved to a display label. */
export interface SelectedFlow {
  readonly id: string;
  readonly label: string;
  readonly isManual: boolean;
}

/**
 * Everything needed to render the report preview and the Slack message —
 * already resolved/filtered down to only what's selected. Built by
 * features/report/lib/buildReportContent.ts and rendered to text by
 * features/report/lib/buildReportText.ts (the same function used for both
 * the live preview and the actual Slack payload, so they can't drift).
 */
export interface ReportContent {
  readonly buildNumber: string;
  readonly environment: Environment | "";
  readonly testedFlows: readonly SelectedFlow[];
  readonly verifiedTickets: readonly VerifiedTicket[];
  readonly createdTickets: readonly YouTrackTicket[];
  readonly notes: string;
}
