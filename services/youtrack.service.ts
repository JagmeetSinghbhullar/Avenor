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

  /** All tickets in the configured project. */
  async getAssignedTickets(): Promise<YouTrackTicket[]> {
    return this.fetchIssues(this.projectScope());
  }

  /** Tickets created today, in the configured project. */
  async getCreatedToday(): Promise<YouTrackTicket[]> {
    return this.fetchIssues(`${this.projectScope()} created: Today`);
  }

  /**
   * Tickets whose CURRENT status is DEV/STAGE/PROD Verified. The YouTrack
   * query already filters server-side by status, but we re-check the
   * returned status locally too (deriveVerifiedEnvironment) as a
   * defense-in-depth double-check of the "always use current status"
   * rule — if a query-syntax edge case ever let a non-matching ticket
   * through, it gets filtered out here rather than shown incorrectly.
   */
  async getVerifiedTickets(): Promise<VerifiedTicket[]> {
    const query = `${this.projectScope()} ${this.config.stateFieldName}: {DEV Verified}, {STAGE Verified}, {PROD Verified}`;
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
  async sync(): Promise<YouTrackSyncResult> {
    const [assignedResult, createdResult, verifiedResult] = await Promise.allSettled([
      this.getAssignedTickets(),
      this.getCreatedToday(),
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

  private async fetchIssues(query: string): Promise<YouTrackTicket[]> {
    const url = new URL(`${this.config.baseUrl}/api/issues`);
    url.searchParams.set("query", query);
    url.searchParams.set("fields", ISSUE_FIELDS);
    url.searchParams.set("$top", String(MAX_RESULTS));

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
      throw new YouTrackServiceError("Could not reach YouTrack. Check YOUTRACK_BASE_URL.", {
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

      if (response.status === 401 || response.status === 403) {
        throw new YouTrackServiceError(
          `YouTrack rejected the API token (HTTP ${response.status}).`,
          {
            status: response.status,
            cause: bodyText,
          }
        );
      }
      throw new YouTrackServiceError(
        `YouTrack request failed with status ${response.status}: ${bodyText.slice(0, 500)}`,
        { status: response.status, cause: bodyText }
      );
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
}
