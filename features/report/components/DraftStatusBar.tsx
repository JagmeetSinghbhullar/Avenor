"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { DraftSaveStatus } from "@/features/report/hooks/useReportDraft";

export interface DraftStatusBarProps {
  status: DraftSaveStatus;
  lastSavedAt: Date | null;
  onSaveDraft: () => void;
}

/**
 * lastSavedAt can be seeded from a server-loaded draft (see
 * useReportDraft's `initial.updatedAt`), so formatting it with
 * toLocaleTimeString() directly during render would risk the same
 * server/client locale mismatch already fixed once in this app for
 * DashboardClient's `today` date — deferred to an effect for the same
 * reason.
 */
export function DraftStatusBar({ status, lastSavedAt, onSaveDraft }: DraftStatusBarProps) {
  const [lastSavedLabel, setLastSavedLabel] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: avoids a server/client locale mismatch, see the comment above this component.
    setLastSavedLabel(
      lastSavedAt
        ? lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : ""
    );
  }, [lastSavedAt]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        {status === "saving" && (
          <span className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <LoadingSpinner size="sm" label="Saving draft" />
            Saving...
          </span>
        )}
        {status === "saved" && (
          <span className="text-success flex items-center gap-1.5 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            Saved
          </span>
        )}
        {status === "error" && (
          <span className="text-danger flex items-center gap-1.5 text-sm font-medium">
            <AlertCircle className="h-4 w-4" strokeWidth={2} />
            Couldn&apos;t save draft. Retrying...
          </span>
        )}
        {lastSavedLabel && (
          <span className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground">Last Saved</span>
            <span className="text-foreground font-medium">{lastSavedLabel}</span>
          </span>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onSaveDraft}
        isLoading={status === "saving"}
      >
        Save Draft
      </Button>
    </div>
  );
}
