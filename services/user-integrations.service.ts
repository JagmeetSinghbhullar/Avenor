import type { SupabaseClient } from "@supabase/supabase-js";

export class UserIntegrationsServiceError extends Error {
  readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "UserIntegrationsServiceError";
    this.status = options?.status ?? 502;
  }
}

export interface YouTrackIntegrationStatus {
  readonly connected: boolean;
  readonly baseUrl: string | null;
  readonly project: string | null;
  readonly stateField: string | null;
  readonly login: string | null;
}

export interface SlackIntegrationStatus {
  readonly connected: boolean;
}

export interface YouTrackCredentials {
  readonly baseUrl: string;
  readonly apiToken: string;
  readonly project: string;
  readonly stateField: string;
  readonly login: string;
}

export interface SaveYouTrackIntegrationInput {
  readonly baseUrl: string;
  readonly project: string;
  readonly stateField: string;
  readonly login: string;
  /** Omit to leave the existing token unchanged (an update that doesn't touch the secret). Required on first connect. */
  readonly apiToken?: string;
}

/**
 * Reads/writes each user's own YouTrack + Slack connection using the
 * caller's session-scoped Supabase client (RLS-protected) — never the
 * service-role key. The secret values (API token, webhook URL) never
 * pass through a plain column: they're written and read via the
 * set_youtrack_token/get_youtrack_token/set_slack_webhook/get_slack_webhook
 * RPC functions defined in supabase/schema.sql, which are the only things
 * able to reach Supabase Vault's decrypted contents, and only for the
 * calling user's own row (each function re-checks auth.uid() itself).
 * This service never calls the get_* functions — reading a decrypted
 * secret back is only ever done server-side at actual sync/send time
 * (a later step), never for display.
 */
export class UserIntegrationsService {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string
  ) {}

  async getYouTrackStatus(): Promise<YouTrackIntegrationStatus> {
    const { data, error } = await this.client
      .from("user_integrations")
      .select("youtrack_base_url, youtrack_api_token, youtrack_project, youtrack_state_field, youtrack_login")
      .eq("user_id", this.userId)
      .maybeSingle();

    if (error) {
      throw new UserIntegrationsServiceError(`Failed to read YouTrack integration: ${error.message}`, {
        cause: error,
      });
    }

    return {
      connected: !!(
        data?.youtrack_base_url &&
        data?.youtrack_api_token &&
        data?.youtrack_project &&
        data?.youtrack_login
      ),
      baseUrl: data?.youtrack_base_url ?? null,
      project: data?.youtrack_project ?? null,
      stateField: data?.youtrack_state_field ?? null,
      login: data?.youtrack_login ?? null,
    };
  }

  async saveYouTrackIntegration(input: SaveYouTrackIntegrationInput): Promise<void> {
    const { error: upsertError } = await this.client.from("user_integrations").upsert(
      {
        user_id: this.userId,
        youtrack_base_url: input.baseUrl,
        youtrack_project: input.project,
        youtrack_state_field: input.stateField || null,
        youtrack_login: input.login,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      throw new UserIntegrationsServiceError(`Failed to save YouTrack settings: ${upsertError.message}`, {
        cause: upsertError,
      });
    }

    if (input.apiToken) {
      const { error: tokenError } = await this.client.rpc("set_youtrack_token", {
        p_token: input.apiToken,
      });
      if (tokenError) {
        throw new UserIntegrationsServiceError(
          `Failed to store YouTrack API token: ${tokenError.message}`,
          { cause: tokenError }
        );
      }
    }
  }

  /**
   * Resolves the full set of credentials a sync actually needs, including
   * the decrypted API token — the ONLY place in the app that calls
   * get_youtrack_token(). Deliberately gated behind a plain-column read
   * first (getYouTrackStatus's underlying query): the Vault RPC, which is
   * the expensive/sensitive part, only runs once we already know every
   * other field is present, and never runs at all just to render a
   * connected/disconnected badge elsewhere. Returns null if not fully
   * connected, so the caller (the sync route) never has to guess.
   */
  async getYouTrackCredentialsForSync(): Promise<YouTrackCredentials | null> {
    const status = await this.getYouTrackStatus();
    if (!status.connected || !status.baseUrl || !status.project || !status.login) {
      return null;
    }

    const { data: apiToken, error } = await this.client.rpc("get_youtrack_token");
    if (error) {
      throw new UserIntegrationsServiceError(
        `Failed to read YouTrack API token: ${error.message}`,
        { cause: error }
      );
    }
    if (!apiToken) {
      return null;
    }

    return {
      baseUrl: status.baseUrl,
      apiToken,
      project: status.project,
      stateField: status.stateField || "State",
      login: status.login,
    };
  }

  async disconnectYouTrack(): Promise<void> {
    const { error } = await this.client
      .from("user_integrations")
      .update({
        youtrack_base_url: null,
        youtrack_api_token: null,
        youtrack_project: null,
        youtrack_state_field: null,
        youtrack_login: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", this.userId);

    if (error) {
      throw new UserIntegrationsServiceError(`Failed to disconnect YouTrack: ${error.message}`, {
        cause: error,
      });
    }
  }

  async getSlackStatus(): Promise<SlackIntegrationStatus> {
    const { data, error } = await this.client
      .from("user_integrations")
      .select("slack_webhook")
      .eq("user_id", this.userId)
      .maybeSingle();

    if (error) {
      throw new UserIntegrationsServiceError(`Failed to read Slack integration: ${error.message}`, {
        cause: error,
      });
    }

    return { connected: !!data?.slack_webhook };
  }

  /**
   * Resolves the caller's decrypted Slack webhook, only decrypting via
   * Vault once the plain-column status check confirms one is actually
   * saved — the same "cheap check first" pattern as
   * getYouTrackCredentialsForSync. Returns null if not connected, so the
   * caller (the send-report route) can distinguish "not connected" from
   * an actual send failure.
   */
  async getSlackWebhookForSync(): Promise<string | null> {
    const status = await this.getSlackStatus();
    if (!status.connected) {
      return null;
    }

    const { data: webhook, error } = await this.client.rpc("get_slack_webhook");
    if (error) {
      throw new UserIntegrationsServiceError(`Failed to read Slack webhook: ${error.message}`, {
        cause: error,
      });
    }
    return webhook ?? null;
  }

  async saveSlackWebhook(webhookUrl: string): Promise<void> {
    const { error } = await this.client.rpc("set_slack_webhook", { p_webhook: webhookUrl });
    if (error) {
      throw new UserIntegrationsServiceError(`Failed to store Slack webhook: ${error.message}`, {
        cause: error,
      });
    }
  }

  async disconnectSlack(): Promise<void> {
    const { error } = await this.client
      .from("user_integrations")
      .update({ slack_webhook: null, updated_at: new Date().toISOString() })
      .eq("user_id", this.userId);

    if (error) {
      throw new UserIntegrationsServiceError(`Failed to disconnect Slack: ${error.message}`, {
        cause: error,
      });
    }
  }
}
