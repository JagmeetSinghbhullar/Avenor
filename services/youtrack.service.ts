import { z } from "zod";
import type {
  VerifiedEnvironment,
  VerifiedTicket,
  YouTrackSyncResult,
  YouTrackTicket,
} from "@/types/youtrack";

/**
 * A ticket counts as verified on a given environment when its State
 * field has EVER made this specific transition at some point in its
 * history — not based on where it currently sits. E.g. a ticket that
 * moved "Dev" -> "Ready for Stage" is DEV-verified from that moment on,
 * even after it later moves through Stage/Prod/Verified — those are
 * separate, independently-tracked transitions, which is why a ticket can
 * end up verified on more than one environment at once (see
 * VerifiedTicket in types/youtrack.ts).
 *
 * These exact strings were confirmed against a real project's actual
 * issue activity history (GET /api/issues/{id}/activities?categories=
 * CustomFieldCategory), not guessed — "Dev" (not "In DEV") and "Ready
 * For Prod" (capital F/P, not "Ready for Prod") both came from real
 * transition data. Compared case-insensitively (see computeVerifiedTickets)
 * so a future minor casing tweak in YouTrack's workflow config doesn't
 * silently zero this out again the way the original casing mismatch did.
 */
const VERIFICATION_TRANSITIONS: Record<VerifiedEnvironment, { from: string; to: string }> = {
  DEV: { from: "Dev", to: "Ready for Stage" },
  STAGE: { from: "Stage", to: "Ready For Prod" },
  PROD: { from: "Prod", to: "Verified" },
};

const VERIFICATION_ENVIRONMENTS = Object.keys(VERIFICATION_TRANSITIONS) as VerifiedEnvironment[];

export class YouTrackServiceError extends Error {
  readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "YouTrackServiceError";
    this.status = options?.status ?? 502;
  }
}

interface YouTrackConfig {
  readonly baseUrl: string;
  readonly apiToken: string;
  readonly projectId: string;
  readonly stateFieldName: string;
}

function readConfigFromEnv(): Partial<YouTrackConfig> {
  return {
    baseUrl: process.env.YOUTRACK_BASE_URL?.replace(/\/$/, ""),
    apiToken: process.env.YOUTRACK_API_TOKEN,
    projectId: process.env.YOUTRACK_PROJECT,
    stateFieldName: process.env.YOUTRACK_STATE_FIELD || "State",
  };
}

/**
 * True only when the fallback has been explicitly opted into
 * (ENABLE_DEV_YOUTRACK_FALLBACK=true) AND every env var needed for the
 * legacy, whole-project sync path is set. Opt-in on purpose: just having
 * YOUTRACK_* set in .env.local (e.g. left over from before per-user
 * integrations existed) must never silently make every unconnected user
 * see a shared project's tickets — someone has to deliberately turn this
 * on. The sync route uses this as a local-development convenience for
 * when a user has no saved YouTrack integration yet — never as a
 * substitute for a real per-user connection in production.
 */
export function isDevFallbackConfigured(): boolean {
  if (process.env.ENABLE_DEV_YOUTRACK_FALLBACK !== "true") {
    return false;
  }
  const config = readConfigFromEnv();
  return !!(config.baseUrl && config.apiToken && config.projectId);
}

// --- Raw YouTrack REST API response shape (internal only) -----------------

/**
 * A custom field's `value` shape depends entirely on the field's type —
 * an object with `name`/`login`/`fullName` for State/Assignee/enum
 * fields (the ones this app actually reads), but e.g. a raw Unix
 * timestamp NUMBER for a DateIssueCustomField ("Due Date"), confirmed
 * against this project's real data. customFields includes every custom
 * field defined on the project, not just the ones we care about, so this
 * is deliberately unvalidated here — mapApiIssueToTicket only ever reads
 * a string out of it via stringFieldValue, which safely returns
 * undefined for any shape (number, boolean, object without that key,
 * etc.) it doesn't recognize, rather than this schema rejecting the
 * entire issue list because of a field this app never even looks at.
 */
const youTrackCustomFieldSchema = z.object({
  name: z.string(),
  value: z.unknown(),
});

const youTrackApiIssueSchema = z.object({
  idReadable: z.string(),
  summary: z.string(),
  created: z.number(),
  customFields: z.array(youTrackCustomFieldSchema),
});

const youTrackApiIssueListSchema = z.array(youTrackApiIssueSchema);

type YouTrackApiIssue = z.infer<typeof youTrackApiIssueSchema>;

const ISSUE_FIELDS = "idReadable,summary,created,customFields(name,value(name,login,fullName))";
const MAX_RESULTS = 200;

// --- Issue activity history (for transition-based verification) -----------

/**
 * YouTrack's REST API models a custom field's added/removed value as an
 * array for every field, including single-value enum fields like State —
 * but this is accepted defensively as either an array or a bare object,
 * since that specific detail isn't confirmed for every YouTrack version
 * and getting it wrong would otherwise silently zero out every result
 * rather than fail loudly.
 */
const activityValueSchema = z.object({ name: z.string().optional() }).nullable();
const activityValueOrArraySchema = z
  .union([activityValueSchema, z.array(activityValueSchema)])
  .nullable()
  .optional();

const activityItemSchema = z.object({
  field: z.object({ name: z.string().optional() }).nullable().optional(),
  added: activityValueOrArraySchema,
  removed: activityValueOrArraySchema,
});

const activityItemListSchema = z.array(activityItemSchema);

type ActivityItem = z.infer<typeof activityItemSchema>;

/** Normalizes the added/removed union above down to a single name, whichever shape the API actually returned. */
function firstActivityValueName(value: ActivityItem["added"]): string {
  if (Array.isArray(value)) {
    return value[0]?.name ?? "";
  }
  return value?.name ?? "";
}

const ACTIVITY_FIELDS = "field(name),added(name),removed(name)";
const ACTIVITY_BATCH_SIZE = 10;

/** Safely reads a string property out of a custom field's `value`, whatever shape it turns out to actually be. */
function stringFieldValue(value: unknown, key: string): string | undefined {
  if (value && typeof value === "object" && key in value) {
    const raw = (value as Record<string, unknown>)[key];
    return typeof raw === "string" ? raw : undefined;
  }
  return undefined;
}

function mapApiIssueToTicket(issue: YouTrackApiIssue, stateFieldName: string): YouTrackTicket {
  const stateField = issue.customFields.find((field) => field.name === stateFieldName);
  const assigneeField = issue.customFields.find((field) => field.name === "Assignee");

  return {
    id: issue.idReadable,
    summary: issue.summary,
    status: stringFieldValue(stateField?.value, "name") ?? "Unknown",
    assignee:
      stringFieldValue(assigneeField?.value, "fullName") ??
      stringFieldValue(assigneeField?.value, "login") ??
      null,
    createdAt: new Date(issue.created).toISOString(),
  };
}

/**
 * Reusable client for the YouTrack REST API. Reads its configuration from
 * environment variables only — never hardcode a URL or token here.
 *
 * Instantiate this per-request (e.g. inside an API route handler), not as
 * a module-level singleton: constructing it validates configuration
 * immediately, and a module-level instance would throw at import time in
 * any context where the env vars aren't set (build, other routes, tests).
 */
export class YouTrackService {
  private readonly config: YouTrackConfig;

  constructor(configOverride: Partial<YouTrackConfig> = {}) {
    const merged = { ...readConfigFromEnv(), ...configOverride };

    if (!merged.baseUrl || !merged.apiToken || !merged.projectId) {
      throw new YouTrackServiceError(
        "YouTrack is not configured. Set YOUTRACK_BASE_URL, YOUTRACK_API_TOKEN, and YOUTRACK_PROJECT.",
        { status: 500 }
      );
    }

    this.config = {
      baseUrl: merged.baseUrl,
      apiToken: merged.apiToken,
      projectId: merged.projectId,
      stateFieldName: merged.stateFieldName || "State",
    };
  }

  /**
   * Verifies Base URL + API Token + Project + Login together by running
   * the exact same query shape production sync uses (project + for-login
   * scoping), just with $top=1 — so a successful test is a real guarantee
   * the saved credentials will work, not a separate, narrower check.
   */
  async testConnection(login: string): Promise<void> {
    // Reuses fetchIssues rather than duplicating its own fetch/error
    // handling — this was previously a separate inline implementation
    // that silently dropped YouTrack's actual error body instead of
    // logging it (unlike every other query here), which made a failed
    // test undiagnosable. $top=1 keeps this a cheap check.
    await this.fetchIssues(`${this.projectScope()} for: {${login}}`, 1);
  }

  /**
   * Tickets assigned to `login`, in the configured project. `login` is
   * optional only for the legacy whole-project dev-fallback path (see
   * isDevFallbackConfigured) — every real per-user sync always passes it.
   */
  async getAssignedTickets(login?: string): Promise<YouTrackTicket[]> {
    const query = login
      ? `${this.projectScope()} Assignee: {${login}}`
      : this.projectScope();
    return this.fetchIssues(query);
  }

  /** Tickets reported by `login` today, in the configured project. */
  async getCreatedToday(login?: string): Promise<YouTrackTicket[]> {
    const query = login
      ? `${this.projectScope()} reporter: {${login}} created: Today`
      : `${this.projectScope()} created: Today`;
    return this.fetchIssues(query);
  }

  /**
   * ALL tickets in the configured project — deliberately not scoped to
   * any assignee. Verification counts are meant to reflect the whole
   * project's QA status regardless of who's assigned each ticket, unlike
   * getAssignedTickets/getCreatedToday, which stay per-user by design.
   * Paginated (not a single fetchIssues call) because MAX_RESULTS (200)
   * is too small to safely assume covers an entire project — silently
   * truncating here would silently undercount every environment.
   */
  private async getAllProjectTickets(): Promise<YouTrackTicket[]> {
    const all: YouTrackTicket[] = [];
    let skip = 0;
    for (;;) {
      const page = await this.fetchIssues(this.projectScope(), MAX_RESULTS, skip);
      all.push(...page);
      if (page.length < MAX_RESULTS) {
        break;
      }
      skip += MAX_RESULTS;
    }
    return all;
  }

  /**
   * Every ticket in the configured project that has made at least one of
   * the DEV/STAGE/PROD verification transitions (see
   * VERIFICATION_TRANSITIONS) at any point in its history — across the
   * whole project, not just tickets assigned to the signed-in user (see
   * getAllProjectTickets). Requires one activity-history request per
   * ticket in the project (fetched in small batches — see
   * computeVerifiedTickets), so this can be slow/expensive for a large
   * project — see the note on sync().
   */
  async getVerifiedTickets(): Promise<VerifiedTicket[]> {
    const tickets = await this.getAllProjectTickets();
    return this.computeVerifiedTickets(tickets);
  }

  /**
   * Assigned-tickets and created-today stay scoped to `login` and run
   * independently (Promise.allSettled) so one failing doesn't blank out
   * the other. Verified tickets are project-wide (see
   * getAllProjectTickets) and run as a third, separate step — NOT scoped
   * to `login` at all, and not derived from the assigned-tickets list
   * the way it used to be, since "verified" is no longer a per-user
   * concept. This can mean one activity-history request per ticket in
   * the entire project on every sync, which may be slow for a large
   * project — consider this a known cost of "every ticket, not just
   * mine" rather than an oversight.
   */
  async sync(login?: string): Promise<YouTrackSyncResult> {
    const [assignedResult, createdResult, verifiedResult] = await Promise.allSettled([
      this.getAssignedTickets(login),
      this.getCreatedToday(login),
      this.getVerifiedTickets(),
    ]);

    const partialErrors: string[] = [];
    const assignedTickets = this.unwrap(assignedResult, "Assigned tickets", partialErrors);
    const createdToday = this.unwrap(createdResult, "Created-today tickets", partialErrors);
    const verifiedTickets = this.unwrap(verifiedResult, "Verified tickets", partialErrors);

    return {
      assignedTickets,
      createdToday,
      verifiedTickets,
      syncedAt: new Date().toISOString(),
      partialErrors: partialErrors.length > 0 ? partialErrors : undefined,
    };
  }

  /**
   * Classifies each of `tickets` by fetching its State-field change
   * history and checking it against every entry in VERIFICATION_TRANSITIONS
   * independently, so a ticket can come back verified on more than one
   * environment. Processed in small batches (not one unbounded
   * Promise.all) to avoid bursting YouTrack's rate limit — `tickets` is
   * now the whole project, so this can mean hundreds of individual
   * activity-history requests on a large project. A single ticket's
   * activity fetch failing is logged and treated as "no transitions
   * found" for that ticket only — it never fails the whole computation
   * (see fetchStateTransitions).
   */
  private async computeVerifiedTickets(
    tickets: readonly YouTrackTicket[]
  ): Promise<VerifiedTicket[]> {
    console.log(
      `[YouTrack Verify] Checking ${tickets.length} project ticket(s) for verification transitions: ${tickets.map((t) => t.id).join(", ") || "(none)"}`
    );

    const verified: VerifiedTicket[] = [];

    for (let i = 0; i < tickets.length; i += ACTIVITY_BATCH_SIZE) {
      const batch = tickets.slice(i, i + ACTIVITY_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (ticket) => {
          const transitions = await this.fetchStateTransitions(ticket.id);
          console.log(
            `[YouTrack Verify] ${ticket.id}: detected transitions -> ` +
              (transitions.length > 0
                ? transitions.map((t) => `"${t.from}" -> "${t.to}"`).join(", ")
                : "(none)")
          );

          const verifiedEnvironments = VERIFICATION_ENVIRONMENTS.filter((env) => {
            const { from, to } = VERIFICATION_TRANSITIONS[env];
            return transitions.some(
              (t) =>
                t.from.toLowerCase() === from.toLowerCase() &&
                t.to.toLowerCase() === to.toLowerCase()
            );
          });
          console.log(
            `[YouTrack Verify] ${ticket.id}: verified buckets -> [${verifiedEnvironments.join(", ") || "none"}]`
          );

          return verifiedEnvironments.length > 0 ? { ...ticket, verifiedEnvironments } : null;
        })
      );
      for (const result of batchResults) {
        if (result) {
          verified.push(result);
        }
      }
    }

    const finalCounts = {
      DEV: verified.filter((t) => t.verifiedEnvironments.includes("DEV")).length,
      STAGE: verified.filter((t) => t.verifiedEnvironments.includes("STAGE")).length,
      PROD: verified.filter((t) => t.verifiedEnvironments.includes("PROD")).length,
    };
    console.log(
      `[YouTrack Verify] Final counts — DEV: ${finalCounts.DEV}, STAGE: ${finalCounts.STAGE}, PROD: ${finalCounts.PROD}`
    );

    return verified;
  }

  /**
   * The configured State field's full added/removed change history for
   * one issue, oldest and newest transitions both included (order doesn't
   * matter to the caller — it only checks whether a specific from/to pair
   * occurred at all). Failures here are logged and return an empty list
   * rather than throwing, since one ticket's history being unreachable
   * shouldn't blank out verification for every other ticket in the sync.
   */
  private async fetchStateTransitions(
    issueId: string
  ): Promise<Array<{ from: string; to: string }>> {
    const url = new URL(`${this.config.baseUrl}/api/issues/${issueId}/activities`);
    url.searchParams.set("categories", "CustomFieldCategory");
    url.searchParams.set("fields", ACTIVITY_FIELDS);
    url.searchParams.set("$top", "100");

    const requestUrl = url.toString();

    let response: Response;
    try {
      response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (cause) {
      console.error("YouTrackService: network error fetching issue activities", {
        url: requestUrl,
        issueId,
        cause,
      });
      return [];
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "<failed to read response body>");
      console.error("YouTrackService: failed to fetch issue activities", {
        url: requestUrl,
        issueId,
        status: response.status,
        body: bodyText,
      });
      return [];
    }

    const json: unknown = await response.json();
    const parsed = activityItemListSchema.safeParse(json);
    if (!parsed.success) {
      console.error("YouTrackService: activities response failed schema validation", {
        url: requestUrl,
        issueId,
        issues: parsed.error.issues,
      });
      return [];
    }

    return parsed.data
      .filter((item) => item.field?.name === this.config.stateFieldName)
      .map((item) => ({
        from: firstActivityValueName(item.removed),
        to: firstActivityValueName(item.added),
      }))
      .filter((transition) => transition.from && transition.to);
  }

  /** Extracts a settled query's value, logging + recording a summary if it failed rather than throwing. */
  private unwrap<T>(result: PromiseSettledResult<T[]>, label: string, errors: string[]): T[] {
    if (result.status === "fulfilled") {
      return result.value;
    }
    console.error(`YouTrackService: "${label}" query failed`, result.reason);
    const message = result.reason instanceof Error ? result.reason.message : String(result.reason);
    errors.push(`${label}: ${message}`);
    return [];
  }

  private projectScope(): string {
    return `project: {${this.config.projectId}}`;
  }

  private async fetchIssues(
    query: string,
    topOverride?: number,
    skipOverride?: number
  ): Promise<YouTrackTicket[]> {
    const url = new URL(`${this.config.baseUrl}/api/issues`);
    url.searchParams.set("query", query);
    url.searchParams.set("fields", ISSUE_FIELDS);
    url.searchParams.set("$top", String(topOverride ?? MAX_RESULTS));
    if (skipOverride) {
      url.searchParams.set("$skip", String(skipOverride));
    }

    // The token lives in the Authorization header, never in the URL, so
    // logging the full URL here can't leak it.
    const requestUrl = url.toString();

    let response: Response;
    try {
      response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (cause) {
      console.error("YouTrackService: network error calling YouTrack", {
        url: requestUrl,
        query,
        cause,
      });
      throw new YouTrackServiceError("Could not reach YouTrack. Check your Base URL in Profile.", {
        cause,
      });
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => "<failed to read response body>");
      console.error("YouTrackService: YouTrack returned an error response", {
        url: requestUrl,
        query,
        status: response.status,
        statusText: response.statusText,
        body: bodyText,
      });

      throw this.classifyErrorResponse(response.status, bodyText);
    }

    const json: unknown = await response.json();
    const parsed = youTrackApiIssueListSchema.safeParse(json);
    if (!parsed.success) {
      console.error("YouTrackService: response failed schema validation", {
        url: requestUrl,
        query,
        issues: parsed.error.issues,
      });
      throw new YouTrackServiceError("YouTrack returned an unexpected response shape.", {
        cause: parsed.error,
      });
    }

    return parsed.data.map((issue) => mapApiIssueToTicket(issue, this.config.stateFieldName));
  }

  /**
   * Turns a non-OK response into a friendly, differentiated error.
   * Status code covers the clear-cut cases (auth, rate limiting); for a
   * 400 — which YouTrack uses for query errors like an unknown project
   * or login — we fall back to a best-effort keyword scan of the error
   * body, since YouTrack doesn't return a structured error code here.
   * That scan only ever narrows the message shown to the user; it never
   * changes what's logged, so the full detail is always available.
   */
  private classifyErrorResponse(status: number, bodyText: string): YouTrackServiceError {
    if (status === 401 || status === 403) {
      return new YouTrackServiceError(
        "YouTrack rejected your API token. Update it in Profile.",
        { status, cause: bodyText }
      );
    }
    if (status === 429) {
      return new YouTrackServiceError(
        "YouTrack rate limit exceeded. Please wait a moment and try again.",
        { status, cause: bodyText }
      );
    }
    if (status === 400) {
      const reason = extractYouTrackErrorReason(bodyText);
      const suffix = reason ? ` (${reason})` : "";
      const lowerBody = bodyText.toLowerCase();
      if (lowerBody.includes("login") || lowerBody.includes("user")) {
        return new YouTrackServiceError(
          `YouTrack rejected your Login. Check it in Profile.${suffix}`,
          { status, cause: bodyText }
        );
      }
      if (lowerBody.includes("project")) {
        return new YouTrackServiceError(
          `YouTrack rejected your Project. Check it in Profile.${suffix}`,
          { status, cause: bodyText }
        );
      }
      return new YouTrackServiceError(
        `YouTrack rejected the request. Check your Project and Login in Profile.${suffix}`,
        { status, cause: bodyText }
      );
    }
    return new YouTrackServiceError(
      `YouTrack request failed with status ${status}: ${bodyText.slice(0, 500)}`,
      { status, cause: bodyText }
    );
  }
}

/**
 * Best-effort extraction of a short, human-readable reason from a
 * YouTrack error response — YouTrack usually returns JSON with an
 * `error_description` (or similar) field, but this only ever narrows an
 * already-friendly message; if parsing fails or the field is missing,
 * callers just show their own generic message instead.
 */
function extractYouTrackErrorReason(bodyText: string): string | null {
  try {
    const parsed: unknown = JSON.parse(bodyText);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const reason = record.error_description ?? record.error_developer_message ?? record.error;
      if (typeof reason === "string" && reason.trim()) {
        return reason.trim().slice(0, 200);
      }
    }
  } catch {
    // Not JSON — fall through.
  }
  return null;
}
