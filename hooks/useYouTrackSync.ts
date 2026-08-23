"use client";

import { useCallback, useEffect, useState } from "react";
import type { YouTrackSyncResult } from "@/types/youtrack";

export interface UseYouTrackSyncResult {
  /** null until the first successful sync (or after a failed one). */
  data: YouTrackSyncResult | null;
  isLoading: boolean;
  error: string | null;
  sync: () => Promise<void>;
}

/**
 * Owns fetching from /api/youtrack/sync so components never call fetch
 * directly. Syncs once automatically on mount, and exposes `sync` for a
 * manual trigger (the dashboard's Sync button).
 */
export function useYouTrackSync(): UseYouTrackSyncResult {
  const [data, setData] = useState<YouTrackSyncResult | null>(null);
  // Starts true because a sync always fires on mount (see the effect below) —
  // this lets the initial effect call stay free of a synchronous setState
  // before its first `await`, which is what the mount-time sync needs.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const performSync = useCallback(async () => {
    try {
      const response = await fetch("/api/youtrack/sync", { method: "POST" });
      const body: { data?: YouTrackSyncResult; error?: string } = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "YouTrack sync failed.");
      }
      setError(null);
      if (body.data) {
        setData(body.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "YouTrack sync failed.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /** Manual trigger (the Sync button) — safe to set state synchronously here since it's an event handler, not an effect. */
  const sync = useCallback((): Promise<void> => {
    setIsLoading(true);
    setError(null);
    return performSync();
  }, [performSync]);

  useEffect(() => {
    // Intentional: this is React's own documented "fetching data in an
    // Effect" pattern (react.dev/learn/synchronizing-with-effects). The
    // lint rule flags any effect-invoked function that calls setState
    // anywhere in its body, with no await-timing analysis — it can't tell
    // this apart from the "adjusting state" anti-pattern it actually
    // targets. performSync has a stable (empty-dependency) identity, so
    // this doesn't loop or cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void performSync();
  }, [performSync]);

  return { data, isLoading, error, sync };
}
