"use client";

import { Plus, Search, Waypoints, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { FLOW_CATEGORIES, FLOWS } from "@/constants/flows";
import { FlowTreeNode } from "@/features/report/components/FlowTreeNode";
import { getFlowsByCategory } from "@/lib/flows";
import type { FlowDefinition } from "@/types/flow";
import type { ManualFlow } from "@/types/flow";

/**
 * Returns every node id that should be visible while searching: a node
 * whose own name matches, plus (so results aren't half-hidden) every one
 * of its descendants; and every ancestor of a match, so the match is
 * actually reachable in the rendered tree.
 */
function computeSearchMatches(flows: readonly FlowDefinition[], query: string): Set<string> {
  const normalizedQuery = query.trim().toLowerCase();
  const matches = new Set<string>();

  function addAllDescendants(node: FlowDefinition) {
    matches.add(node.id);
    node.children?.forEach(addAllDescendants);
  }

  function visit(node: FlowDefinition): boolean {
    if (node.name.toLowerCase().includes(normalizedQuery)) {
      addAllDescendants(node);
      return true;
    }
    let childMatches = false;
    for (const child of node.children ?? []) {
      if (visit(child)) childMatches = true;
    }
    if (childMatches) matches.add(node.id);
    return childMatches;
  }

  flows.forEach(visit);
  return matches;
}

export interface TestedFlowsTreeProps {
  selectedFlowIds: ReadonlySet<string>;
  manualFlows: readonly ManualFlow[];
  onToggleFlow: (leafIds: readonly string[], checked: boolean) => void;
  onAddManualFlow: (name: string) => void;
  onRemoveManualFlow: (id: string) => void;
}

export function TestedFlowsTree({
  selectedFlowIds,
  manualFlows,
  onToggleFlow,
  onAddManualFlow,
  onRemoveManualFlow,
}: TestedFlowsTreeProps) {
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [manualFlowName, setManualFlowName] = useState("");

  const searchMatchIds = useMemo(() => {
    if (!search.trim()) return null;
    return computeSearchMatches(FLOWS, search);
  }, [search]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const categories = FLOW_CATEGORIES.filter((category) => category.id !== "manual");

  const handleAddManualFlow = () => {
    const trimmed = manualFlowName.trim();
    if (!trimmed) return;
    onAddManualFlow(trimmed);
    setManualFlowName("");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col p-4 sm:p-6">
        <SectionHeader
          title="Tested Flows"
          description="Select flows you have tested today"
          icon={<Waypoints className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-violet-50 text-violet-600"
          className="border-b-0 pb-0"
        />

        <div className="relative mt-4">
          <Search
            aria-hidden="true"
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          />
          <Input
            aria-label="Search flows"
            placeholder="Search flows..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>

        <div className="mt-3 flex flex-col gap-4">
          {categories.map((category) => {
            const roots = getFlowsByCategory(category.id);
            if (searchMatchIds && !roots.some((root) => searchMatchIds.has(root.id))) {
              return null;
            }
            return (
              <div key={category.id}>
                <h3 className="text-muted-foreground px-1.5 py-1.5 text-xs font-semibold tracking-wider uppercase">
                  {category.name}
                </h3>
                {roots.map((root) => (
                  <FlowTreeNode
                    key={root.id}
                    flow={root}
                    depth={0}
                    selectedIds={selectedFlowIds}
                    expandedIds={expandedIds}
                    searchMatchIds={searchMatchIds}
                    onToggleSelect={onToggleFlow}
                    onToggleExpand={toggleExpand}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <SectionHeader
          title="Manual Flow"
          description="Add any flows that are not in the list"
          icon={<Plus className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-violet-50 text-violet-600"
          className="border-b-0 pb-0"
        />
        <div className="mt-4 flex gap-2">
          <Input
            aria-label="Manual flow name"
            placeholder="e.g. Regression test for Sprint 25"
            value={manualFlowName}
            onChange={(event) => setManualFlowName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddManualFlow();
              }
            }}
            className="flex-1"
          />
          <Button
            type="button"
            variant="primary"
            onClick={handleAddManualFlow}
            disabled={!manualFlowName.trim()}
          >
            Add
          </Button>
        </div>
        {manualFlows.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">No manual flows added yet</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-1.5">
            {manualFlows.map((flow) => (
              <li
                key={flow.id}
                className="border-border bg-surface hover:border-border-strong flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors duration-150"
              >
                <span className="text-foreground">{flow.name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveManualFlow(flow.id)}
                  aria-label={`Remove ${flow.name}`}
                  className="text-muted-foreground hover:text-danger rounded p-0.5 transition-colors duration-150"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
