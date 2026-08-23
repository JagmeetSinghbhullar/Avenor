import { FLOWS } from "@/constants/flows";
import { findFlowById, getFlowCategory, getFlowPath } from "@/lib/flows";
import type { ManualFlow } from "@/types/flow";
import type { Environment, ReportContent, SelectedFlow } from "@/types/report";
import type { VerifiedTicket, YouTrackTicket } from "@/types/youtrack";

export interface BuildReportContentInput {
  readonly buildNumber: string;
  readonly environment: Environment | "";
  readonly notes: string;
  readonly selectedFlowIds: ReadonlySet<string>;
  readonly manualFlows: readonly ManualFlow[];
  /** All fetched tickets are included in the report automatically — no selection. */
  readonly createdTickets: readonly YouTrackTicket[];
  readonly verifiedTickets: readonly VerifiedTicket[];
}

/**
 * Resolves all the report-draft state (ids, sets) into the fully-formed
 * shape the preview and the Slack message are rendered from. Pure — no
 * React, no I/O — so it's usable from the page (client) and the send API
 * route (server) alike.
 */
export function buildReportContent(input: BuildReportContentInput): ReportContent {
  const manualFlowIds = new Set(input.manualFlows.map((flow) => flow.id));

  // Category is metadata on each flow, not part of the tree path itself,
  // but several flow names (e.g. "Course Consumption Flow") repeat
  // identically across categories — prefixing the category name is what
  // keeps a report entry unambiguous about which one was actually tested.
  const selectedCatalogFlows: SelectedFlow[] = [];
  for (const id of input.selectedFlowIds) {
    if (manualFlowIds.has(id)) continue;
    const path = getFlowPath(id, FLOWS);
    const flow = findFlowById(id, FLOWS);
    if (path && flow) {
      const category = getFlowCategory(flow.category);
      const label = category ? `${category.name} > ${path.join(" > ")}` : path.join(" > ");
      selectedCatalogFlows.push({ id, label, isManual: false });
    }
  }

  const selectedManualFlows: SelectedFlow[] = input.manualFlows
    .filter((flow) => input.selectedFlowIds.has(flow.id))
    .map((flow) => ({ id: flow.id, label: flow.name, isManual: true }));

  return {
    buildNumber: input.buildNumber,
    environment: input.environment,
    testedFlows: [...selectedCatalogFlows, ...selectedManualFlows],
    verifiedTickets: input.verifiedTickets,
    createdTickets: input.createdTickets,
    notes: input.notes,
  };
}
