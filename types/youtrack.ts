/**
 * Domain types for the YouTrack integration. These are what the rest of
 * the app (hooks, components) works with — the raw YouTrack API response
 * shape is an internal implementation detail of services/youtrack.service.ts
 * and never leaks past it.
 */

export type VerifiedEnvironment = "DEV" | "STAGE" | "PROD";

export interface YouTrackTicket {
  readonly id: string;
  readonly summary: string;
  /** The ticket's current status name (e.g. "In Progress", "DEV Verified"). */
  readonly status: string;
  readonly assignee: string | null;
  readonly createdAt: string;
}

/**
 * A YouTrackTicket whose CURRENT status is one of DEV/STAGE/PROD Verified.
 * `verifiedEnvironment` is derived from `status` at fetch time — see
 * deriveVerifiedEnvironment in services/youtrack.service.ts. If the ticket
 * moves off a Verified status, the next sync simply won't include it here
 * anymore; nothing about this shape depends on history.
 */
export interface VerifiedTicket extends YouTrackTicket {
  readonly verifiedEnvironment: VerifiedEnvironment;
}

export interface YouTrackSyncResult {
  readonly assignedTickets: readonly YouTrackTicket[];
  readonly createdToday: readonly YouTrackTicket[];
  readonly verifiedTickets: readonly VerifiedTicket[];
  readonly syncedAt: string;
  /**
   * Populated when one or more of the three queries above failed but the
   * others still succeeded (e.g. the verified-tickets query rejected
   * because the configured status names don't exist in this YouTrack
   * project's State field, while assigned/created-today are unaffected).
   * The full detail is always logged server-side; this is a short,
   * human-readable summary per failed query.
   */
  readonly partialErrors?: readonly string[];
}
