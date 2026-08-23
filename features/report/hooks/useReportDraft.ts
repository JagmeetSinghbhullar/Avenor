"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createManualFlow } from "@/lib/flows";
import type { ManualFlow } from "@/types/flow";
import type { Environment } from "@/types/report";

/** Small internal helper for tracking a set of selected ids — used for flow selection. */
function useIdSelection(initialIds?: readonly string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialIds));

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

export interface ReportDraftInit {
  readonly buildNumber?: string;
  readonly environment?: Environment | "";
  readonly notes?: string;
  readonly selectedFlowIds?: readonly string[];
  readonly manualFlows?: readonly ManualFlow[];
  /** ISO timestamp of the draft's last save, if one was ever loaded from the server. */
  readonly updatedAt?: string | null;
}

export type DraftSaveStatus = "idle" | "saving" | "saved" | "error";

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

  saveStatus: DraftSaveStatus;
  lastSavedAt: Date | null;
  /** Saves immediately, bypassing the debounce — for the explicit "Save Draft" button. */
  saveDraft: () => Promise<void>;
}

const AUTOSAVE_DELAY_MS = 1000;
const RETRY_DELAY_MS = 4000;

/**
 * Owns every piece of state that goes into building today's report.
 * Seeded from `initial` (the caller's saved draft, loaded server-side)
 * so a returning user sees their in-progress report restored rather than
 * a blank form. After the initial render, any change autosaves to
 * /api/reports/draft after a short debounce — the very first effect run
 * is skipped so simply loading a saved draft doesn't immediately re-save
 * the exact same values back. A failed save retries automatically on a
 * fixed delay until it succeeds or a new edit supersedes it; nothing here
 * ever surfaces a blocking alert — saveStatus is the only signal.
 */
export function useReportDraft(initial?: ReportDraftInit): UseReportDraftResult {
  const [buildNumber, setBuildNumber] = useState(initial?.buildNumber ?? "");
  const [environment, setEnvironment] = useState<Environment | "">(initial?.environment ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [manualFlows, setManualFlows] = useState<ManualFlow[]>([...(initial?.manualFlows ?? [])]);

  const flowSelection = useIdSelection(initial?.selectedFlowIds);

  const [saveStatus, setSaveStatus] = useState<DraftSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    initial?.updatedAt ? new Date(initial.updatedAt) : null
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [saveAttempt, setSaveAttempt] = useState(0);

  const performSave = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/reports/draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buildNumber,
          environment,
          notes,
          selectedFlowIds: Array.from(flowSelection.selected),
          manualFlows,
        }),
      });
      if (!response.ok) {
        throw new Error(`Draft save failed with status ${response.status}`);
      }
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    } catch (err) {
      console.error("Failed to autosave report draft", err);
      setSaveStatus("error");
      // saveAttempt always increments, even though saveStatus stays
      // "error" across consecutive failures — since React bails out of
      // re-running an effect when none of its dependencies actually
      // changed value, the retry effect below needs a value that's
      // guaranteed to change on every failure, or a second consecutive
      // failure would never schedule another retry.
      setSaveAttempt((n) => n + 1);
    }
  }, [buildNumber, environment, notes, manualFlows, flowSelection.selected]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Deferred to a timeout (not called directly here), so this effect
    // itself never calls setState synchronously.
    saveTimeoutRef.current = setTimeout(() => void performSave(), AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [buildNumber, environment, notes, manualFlows, flowSelection.selected, performSave]);

  /**
   * Retries a failed save on a fixed delay, independent of the debounce
   * effect above. Keyed off `performSave` (not just saveStatus/
   * saveAttempt) so a new edit — which gives performSave a fresh
   * closure over the latest field values — cancels this pending retry
   * via the cleanup below rather than letting it fire with stale values;
   * the debounce effect's own save then takes over.
   */
  useEffect(() => {
    if (saveStatus !== "error") {
      return;
    }
    const timeoutId = setTimeout(() => void performSave(), RETRY_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [saveStatus, saveAttempt, performSave]);

  const saveDraft = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);

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

    saveStatus,
    lastSavedAt,
    saveDraft,
  };
}
