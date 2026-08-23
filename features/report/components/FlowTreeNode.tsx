"use client";

import { ChevronRight, Folder } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/cn";
import { getSelectableFlows } from "@/lib/flows";
import type { FlowDefinition } from "@/types/flow";

export interface FlowTreeNodeProps {
  flow: FlowDefinition;
  depth: number;
  selectedIds: ReadonlySet<string>;
  expandedIds: ReadonlySet<string>;
  /** null when not searching (normal expand/collapse rules apply). Non-null = only render ids in this set, always expanded. */
  searchMatchIds: ReadonlySet<string> | null;
  onToggleSelect: (leafIds: readonly string[], checked: boolean) => void;
  onToggleExpand: (id: string) => void;
}

export function FlowTreeNode({
  flow,
  depth,
  selectedIds,
  expandedIds,
  searchMatchIds,
  onToggleSelect,
  onToggleExpand,
}: FlowTreeNodeProps) {
  if (searchMatchIds && !searchMatchIds.has(flow.id)) {
    return null;
  }

  const isGroup = !!flow.children?.length;
  const leafIds = isGroup ? getSelectableFlows([flow]).map((f) => f.id) : [flow.id];
  const selectedCount = leafIds.filter((id) => selectedIds.has(id)).length;
  const checked = leafIds.length > 0 && selectedCount === leafIds.length;
  const indeterminate = selectedCount > 0 && selectedCount < leafIds.length;
  const isExpanded = searchMatchIds ? true : expandedIds.has(flow.id);
  const isRowActive = checked || indeterminate;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1.5 rounded-lg py-1.5 pr-3 transition-colors duration-150",
          isRowActive ? "bg-primary-subtle/50" : "hover:bg-muted/60"
        )}
        style={{ paddingLeft: `${0.25 + depth * 1.25}rem` }}
      >
        {isGroup ? (
          <button
            type="button"
            onClick={() => onToggleExpand(flow.id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${flow.name}` : `Expand ${flow.name}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors duration-150"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 transition-transform duration-150",
                isExpanded && "rotate-90"
              )}
              strokeWidth={2}
            />
          </button>
        ) : (
          <span aria-hidden="true" className="h-5 w-5 shrink-0" />
        )}
        {isGroup && (
          <Folder
            aria-hidden="true"
            className="text-primary h-3.5 w-3.5 shrink-0"
            strokeWidth={2}
          />
        )}
        <div className="min-w-0 flex-1">
          <Checkbox
            label={flow.name}
            checked={checked}
            indeterminate={indeterminate}
            onChange={(event) => onToggleSelect(leafIds, event.target.checked)}
          />
        </div>
        {isGroup && (
          <span
            aria-hidden="true"
            className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
          >
            {leafIds.length}
          </span>
        )}
      </div>
      {isGroup && isExpanded && (
        <div
          className="border-border/70 border-l"
          style={{ marginLeft: `${0.25 + depth * 1.25 + 0.85}rem` }}
        >
          {flow.children!.map((child) => (
            <FlowTreeNode
              key={child.id}
              flow={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              searchMatchIds={searchMatchIds}
              onToggleSelect={onToggleSelect}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}
