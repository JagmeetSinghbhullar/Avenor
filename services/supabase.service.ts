import type { SupabaseClient } from "@supabase/supabase-js";
import type { ManualFlow } from "@/types/flow";
import type { Environment } from "@/types/report";

export class SupabaseServiceError extends Error {
  readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "SupabaseServiceError";
    this.status = options?.status ?? 502;
  }
}

export interface SaveReportInput {
  readonly userId: string;
  readonly reportDate: string;
  readonly buildNumber: string;
  readonly environment: string;
  readonly testedFlows: unknown;
  readonly verifiedTickets: unknown;
  readonly createdTickets: unknown;
  readonly notes: string;
  readonly slackPayload: unknown;
}

/**
 * Persists reports using the CALLER's session-scoped Supabase client (see
 * lib/supabase/server.ts) — never the service-role key. Access is
 * therefore governed by the RLS policies in supabase/schema.sql
 * (auth.uid() = user_id), not by an all-access key that would bypass
 * them. The caller (a Route Handler) is responsible for creating that
 * client from the request's session and passing it in here, along with
 * the authenticated user's id — never trust a client-supplied user_id.
 */
export class SupabaseService {
  constructor(private readonly client: SupabaseClient) {}

  async saveReport(input: SaveReportInput): Promise<void> {
    const { error } = await this.client.from("reports").insert({
      user_id: input.userId,
      report_date: input.reportDate,
      build_number: input.buildNumber,
      environment: input.environment,
      tested_flows: input.testedFlows,
      verified_tickets: input.verifiedTickets,
      created_tickets: input.createdTickets,
      notes: input.notes,
      slack_payload: input.slackPayload,
    });

    if (error) {
      throw new SupabaseServiceError(`Failed to save report to Supabase: ${error.message}`, {
        status: 502,
        cause: error,
      });
    }
  }

  /** Loads the caller's in-progress report draft, if they have one. */
  async getReportDraft(userId: string): Promise<ReportDraftWithMeta | null> {
    const { data, error } = await this.client
      .from("report_drafts")
      .select("build_number, environment, notes, selected_flow_ids, manual_flows, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new SupabaseServiceError(`Failed to load report draft: ${error.message}`, {
        status: 502,
        cause: error,
      });
    }
    if (!data) {
      return null;
    }

    return {
      buildNumber: data.build_number ?? "",
      environment: (data.environment ?? "") as Environment | "",
      notes: data.notes ?? "",
      selectedFlowIds: Array.isArray(data.selected_flow_ids) ? data.selected_flow_ids : [],
      manualFlows: Array.isArray(data.manual_flows) ? data.manual_flows : [],
      updatedAt: data.updated_at ?? null,
    };
  }

  /** Overwrites the caller's report draft in place — always a full replace, never a partial patch. */
  async saveReportDraft(userId: string, draft: ReportDraftData): Promise<void> {
    const { error } = await this.client.from("report_drafts").upsert(
      {
        user_id: userId,
        build_number: draft.buildNumber,
        environment: draft.environment,
        notes: draft.notes,
        selected_flow_ids: draft.selectedFlowIds,
        manual_flows: draft.manualFlows,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      throw new SupabaseServiceError(`Failed to save report draft: ${error.message}`, {
        status: 502,
        cause: error,
      });
    }
  }
}

export interface ReportDraftData {
  readonly buildNumber: string;
  readonly environment: Environment | "";
  readonly notes: string;
  readonly selectedFlowIds: readonly string[];
  readonly manualFlows: readonly ManualFlow[];
}

export interface ReportDraftWithMeta extends ReportDraftData {
  readonly updatedAt: string | null;
}
