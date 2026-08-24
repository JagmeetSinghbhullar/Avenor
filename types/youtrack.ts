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
 * A YouTrackTicket that has, at some point in its history, made a
 * specific QA-verification state transition for one or more
 * environments (e.g. "In DEV" -> "Ready for Stage" counts as verified on
 * DEV) — see computeVerifiedTickets in services/youtrack.service.ts.
 * Unlike a check against the ticket's current status, this is based on
 * transition history, so a ticket can be verified on more than one
 * environment at once (e.g. it passed DEV verification earlier and has
 * since also passed STAGE verification) — hence an array here, not a
 * single value.
 */
export interface VerifiedTicket extends YouTrackTicket {
  readonly verifiedEnvironments: readonly VerifiedEnvironment[];
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
