export class SlackServiceError extends Error {
  readonly status: number;

  constructor(message: string, options?: { status?: number; cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "SlackServiceError";
    this.status = options?.status ?? 502;
  }
}

/**
 * Reusable client for a Slack Incoming Webhook. Reads its URL from an
 * environment variable only. Instantiate per-request (see the note on
 * YouTrackService for why — same reasoning applies here).
 */
export class SlackService {
  private readonly webhookUrl: string;

  constructor(webhookUrlOverride?: string) {
    const webhookUrl = webhookUrlOverride ?? process.env.SLACK_INCOMING_WEBHOOK_URL;
    if (!webhookUrl) {
      throw new SlackServiceError("Slack is not configured. Set SLACK_INCOMING_WEBHOOK_URL.", {
        status: 500,
      });
    }
    this.webhookUrl = webhookUrl;
  }

  /** `text` is interpreted as Slack mrkdwn by incoming webhooks. */
  async sendMessage(text: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (cause) {
      throw new SlackServiceError("Could not reach Slack.", { cause });
    }

    if (!response.ok) {
      throw new SlackServiceError(`Slack webhook failed with status ${response.status}.`, {
        status: 502,
      });
    }
  }
}
