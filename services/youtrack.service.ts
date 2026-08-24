import { z } from "zod";
import type {
  VerifiedEnvironment,
  VerifiedTicket,
  YouTrackSyncResult,
  YouTrackTicket,
} from "@/types/youtrack";

/**
 * A ticket counts as verified ONLY if its CURRENT status is one of these.
 * We never look at ticket history — a ticket that has moved off one of
 * these statuses (back to To Do / In Progress / Reopened, or anywhere
 * else) simply won't appear in the list the next time this map is
 * consulted, because it's applied fresh to the live status on every sync.
 */
const VERIFIED_STATUS_TO_ENVIRONMENT: Record<string, VerifiedEnvironment> = {
  "DEV Verified": "DEV",
  "STAGE Verified": "STAGE",
  "PROD Verified": "PROD",
};

export function deriveVerifiedEnvironment(status: string): VerifiedEnvironment | null {
  return VERIFIED_STATUS_TO_ENVIRONMENT[status] ?? null;
}

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

const youTrackFieldValueSchema = z
  .object({
    name: z.string().optional(),
    login: z.string().optional(),
    fullName: z.string().optional(),
  })
  .nullable();

const youTrackCustomFieldSchema = z.object({
  name: z.string(),
  value: youTrackFieldValueSchema,
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

function mapApiIssueToTicket(issue: YouTrackApiIssue, stateFieldName: string): YouTrackTicket {
  const stateField = issue.customFields.find((field) => field.name === stateFieldName);
  const assigneeField = issue.customFields.find((field) => field.name === "Assignee");

  return {
    id: issue.idReadable,
    summary: issue.summary,
    status: stateField?.value?.name ?? "Unknown",
    assignee: assigneeField?.value?.fullName ?? assigneeField?.value?.login ?? null,
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
   * Tickets assigned to `login` whose CURRENT status is DEV/STAGE/PROD
   * Verified — same identity as getAssignedTickets, since a verified
   * ticket is one this QA engineer owns and has moved to Verified. The
   * YouTrack query already filters server-side by status, but we
   * re-check the returned status locally too (deriveVerifiedEnvironment)
   * as a defense-in-depth double-check of the "always use current
   * status" rule — if a query-syntax edge case ever let a non-matching
   * ticket through, it gets filtered out here rather than shown
   * incorrectly.
   */
  async getVerifiedTickets(login?: string): Promise<VerifiedTicket[]> {
    const scope = login ? `${this.projectScope()} Assignee: {${login}}` : this.projectScope();
    const query = `${scope} ${this.config.stateFieldName}: {DEV Verified}, {STAGE Verified}, {PROD Verified}`;
    const tickets = await this.fetchIssues(query);

    return tickets.reduce<VerifiedTicket[]>((verified, ticket) => {
      const verifiedEnvironment = deriveVerifiedEnvironment(ticket.status);
      if (verifiedEnvironment) {
        verified.push({ ...ticket, verifiedEnvironment });
      }
      return verified;
    }, []);
  }

  /**
   * Runs the three queries independently (Promise.allSettled, not
   * Promise.all) so a single one failing — e.g. the verified-tickets
   * query being rejected because the configured status names aren't
   * valid State values in this project — doesn't blank out the other
   * two, which have nothing to do with it and may well have succeeded.
   */
  async sync(login?: string): Promise<YouTrackSyncResult> {
    const [assignedResult, createdResult, verifiedResult] = await Promise.allSettled([
      this.getAssignedTickets(login),
      this.getCreatedToday(login),
      this.getVerifiedTickets(login),
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

  private async fetchIssues(query: string, topOverride?: number): Promise<YouTrackTicket[]> {
    const url = new URL(`${this.config.baseUrl}/api/issues`);
    url.searchParams.set("query", query);
    url.searchParams.set("fields", ISSUE_FIELDS);
    url.searchParams.set("$top", String(topOverride ?? MAX_RESULTS));

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
