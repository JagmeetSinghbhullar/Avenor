/**
 * Domain types for the Tested Flows feature.
 *
 * A "flow" is a discrete, testable path through the product (e.g. "Forgot
 * Password Flow"). Flows are grouped by category and may be nested to
 * represent sub-flows belonging to a parent flow (e.g. "Course Consumption
 * Flow" -> "Vivid Mode").
 */

/**
 * Category a flow belongs to.
 *
 * This is a manually declared union rather than one derived from
 * FLOW_CATEGORIES so that types/flow.ts has zero runtime dependencies.
 * Adding a new category requires two edits: add the id here, and add a
 * matching entry to FLOW_CATEGORIES in constants/flows.ts. Both edits stay
 * inside these two files — no component or feature code ever hardcodes a
 * category.
 */
export type FlowCategoryId = "ui" | "studio" | "mission-control" | "manual";

export interface FlowCategoryDefinition {
  readonly id: FlowCategoryId;
  readonly name: string;
}

/**
 * A single flow in the predefined catalog. Flows form a tree: a flow with
 * `children` is a group (e.g. "Course Consumption Flow") whose children are
 * the individually testable sub-flows; a flow without `children` is a leaf
 * that can be selected directly.
 *
 * `id` is a stable, hand-authored identifier and must never be derived from
 * `name` at runtime. Reports persist the id, so renaming a flow's display
 * name later must never orphan historical report data.
 *
 * `enabled` lets a flow be retired from selection without deleting it —
 * deleting would break `findFlowById` lookups for old reports that still
 * reference it.
 */
export interface FlowDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: FlowCategoryId;
  readonly description?: string;
  readonly enabled: boolean;
  readonly children?: readonly FlowDefinition[];
}

/**
 * A QA-engineer-created flow that is not part of the predefined catalog
 * (e.g. "Regression for Sprint 25"). Created ad hoc while building a
 * report; not persisted back into the FLOWS catalog.
 */
export interface ManualFlow {
  readonly id: string;
  readonly name: string;
  readonly category: FlowCategoryId;
  readonly createdAt: string;
}

/** Where a FlowReportEntry originated. */
export type FlowSource = "predefined" | "manual";

/**
 * A flattened, tree-agnostic reference to a single selectable flow.
 *
 * This is the shape future consumers (Tested Flows UI, Slack report
 * generator, Supabase persistence) should work with, rather than walking
 * the FlowDefinition tree themselves each time. `path` carries the full
 * ancestor chain (root-first) so leaf names that repeat across the tree
 * (e.g. "Settings", "Reports") stay unambiguous once flattened.
 */
export interface FlowReportEntry {
  readonly id: string;
  readonly name: string;
  readonly category: FlowCategoryId;
  readonly path: readonly string[];
  readonly source: FlowSource;
}
