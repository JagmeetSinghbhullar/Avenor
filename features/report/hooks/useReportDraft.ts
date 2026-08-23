"use client";

import { useCallback, useState } from "react";
import { createManualFlow } from "@/lib/flows";
import type { ManualFlow } from "@/types/flow";
import type { Environment } from "@/types/report";

/** Small internal helper for tracking a set of selected ids — used for flow selection. */
function useIdSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleMany = useCallback((ids: readonly string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  return { selected, toggleMany } as const;
}

export interface UseReportDraftResult {
  buildNumber: string;
  setBuildNumber: (value: string) => void;
  environment: Environment | "";
  setEnvironment: (value: Environment | "") => void;
  notes: string;
  setNotes: (value: string) => void;

  selectedFlowIds: ReadonlySet<string>;
  manualFlows: readonly ManualFlow[];
  /** Handles both a single leaf and a whole group's leaf ids at once. */
  toggleFlowSelection: (leafIds: readonly string[], checked: boolean) => void;
  addManualFlow: (name: string) => void;
  removeManualFlow: (id: string) => void;
}

/** Owns every piece of state that goes into building today's report. Pure state — no fetching, no persistence. */
export function useReportDraft(): UseReportDraftResult {
  const [buildNumber, setBuildNumber] = useState("");
  const [environment, setEnvironment] = useState<Environment | "">("");
  const [notes, setNotes] = useState("");
  const [manualFlows, setManualFlows] = useState<ManualFlow[]>([]);

  const flowSelection = useIdSelection();

  const addManualFlow = useCallback(
    (name: string) => {
      const manualFlow = createManualFlow(name);
      setManualFlows((prev) => [...prev, manualFlow]);
      flowSelection.toggleMany([manualFlow.id], true);
    },
    [flowSelection]
  );

  const removeManualFlow = useCallback(
    (id: string) => {
      setManualFlows((prev) => prev.filter((flow) => flow.id !== id));
      flowSelection.toggleMany([id], false);
    },
    [flowSelection]
  );

  return {
    buildNumber,
    setBuildNumber,
    environment,
    setEnvironment,
    notes,
    setNotes,

    selectedFlowIds: flowSelection.selected,
    manualFlows,
    toggleFlowSelection: flowSelection.toggleMany,
    addManualFlow,
    removeManualFlow,
  };
}
