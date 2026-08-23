import { FLOWS, FLOW_CATEGORIES } from "@/constants/flows";
import type {
  FlowCategoryDefinition,
  FlowCategoryId,
  FlowDefinition,
  FlowReportEntry,
  ManualFlow,
} from "@/types/flow";

/**
 * Pure domain functions for querying the FLOWS catalog and for creating
 * manual (temporary) flows. No React, no I/O, no side effects beyond id/
 * timestamp generation — safe to call from server or client code.
 */

/** Looks up a category's display definition by id. */
export function getFlowCategory(categoryId: FlowCategoryId): FlowCategoryDefinition | undefined {
  return FLOW_CATEGORIES.find((category) => category.id === categoryId);
}

/** Returns the top-level flows belonging to a single category. */
export function getFlowsByCategory(categoryId: FlowCategoryId): readonly FlowDefinition[] {
  return FLOWS.filter((flow) => flow.category === categoryId);
}

/**
 * Recursively walks the flow tree and returns every node — including group
 * nodes that have children — as a flat list. Useful for lookups that don't
 * care about tree position.
 */
export function flattenFlows(flows: readonly FlowDefinition[] = FLOWS): FlowDefinition[] {
  const result: FlowDefinition[] = [];
  for (const flow of flows) {
    result.push(flow);
    if (flow.children?.length) {
      result.push(...flattenFlows(flow.children));
    }
  }
  return result;
}

/**
 * Finds a single flow anywhere in the tree by id. Traverses regardless of
 * `enabled` so a disabled flow referenced by an old report can still be
 * resolved to a display name.
 */
export function findFlowById(
  id: string,
  flows: readonly FlowDefinition[] = FLOWS
): FlowDefinition | undefined {
  for (const flow of flows) {
    if (flow.id === id) return flow;
    if (flow.children?.length) {
      const match = findFlowById(id, flow.children);
      if (match) return match;
    }
  }
  return undefined;
}

/**
 * Returns the root-first ancestor chain of names leading to `id`, including
 * the flow's own name. Use this to render an unambiguous label for flows
 * whose leaf name repeats elsewhere in the tree (e.g. "Settings" exists
 * under both the UI and Studio "Course Consumption Flow" groups).
 */
export function getFlowPath(
  id: string,
  flows: readonly FlowDefinition[] = FLOWS
): string[] | undefined {
  for (const flow of flows) {
    if (flow.id === id) return [flow.name];
    if (flow.children?.length) {
      const childPath = getFlowPath(id, flow.children);
      if (childPath) return [flow.name, ...childPath];
    }
  }
  return undefined;
}

/**
 * Flattens the catalog into report-ready leaf entries. Group nodes (flows
 * with children, e.g. "Course Consumption Flow") are excluded since they
 * aren't individually testable — their children are. Disabled flows, and
 * any of their children, are excluded.
 */
export function getSelectableFlows(flows: readonly FlowDefinition[] = FLOWS): FlowReportEntry[] {
  const entries: FlowReportEntry[] = [];

  const walk = (nodes: readonly FlowDefinition[], trail: readonly string[]) => {
    for (const flow of nodes) {
      if (!flow.enabled) continue;
      const path = [...trail, flow.name];
      if (flow.children?.length) {
        walk(flow.children, path);
      } else {
        entries.push({
          id: flow.id,
          name: flow.name,
          category: flow.category,
          path,
          source: "predefined",
        });
      }
    }
  };

  walk(flows, []);
  return entries;
}

/** Converts a manual flow into the same report-entry shape as a predefined flow. */
export function toReportEntry(manualFlow: ManualFlow): FlowReportEntry {
  return {
    id: manualFlow.id,
    name: manualFlow.name,
    category: manualFlow.category,
    path: [manualFlow.name],
    source: "manual",
  };
}

/**
 * Creates a new manual (temporary) flow. `id` is generated at creation
 * time — never derived from `name` — so two manual flows with the same
 * name in the same report don't collide.
 */
export function createManualFlow(name: string, category: FlowCategoryId = "manual"): ManualFlow {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Manual flow name cannot be empty.");
  }

  return {
    id: `manual.${crypto.randomUUID()}`,
    name: trimmedName,
    category,
    createdAt: new Date().toISOString(),
  };
}

/** Type guard distinguishing a ManualFlow from a predefined FlowDefinition. */
export function isManualFlow(flow: ManualFlow | FlowDefinition): flow is ManualFlow {
  return "createdAt" in flow;
}
