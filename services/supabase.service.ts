import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseServiceError extends Error {
  readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "SupabaseServiceError";
    this.status = options?.status ?? 502;
  }
}

export interface SaveReportInput {
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
 * Reusable Supabase client for persisting reports. Uses the service-role
 * key (server-only — never expose this to the browser) since there is no
 * authenticated user yet to scope a row-level-security policy to; the
 * `reports` table has RLS enabled with no public policies, so this key is
 * the only way to write to it. See supabase/schema.sql for the table
 * definition this expects to already exist.
 */
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new SupabaseServiceError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        { status: 500 }
      );
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async saveReport(input: SaveReportInput): Promise<void> {
    const { error } = await this.client.from("reports").insert({
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
}
