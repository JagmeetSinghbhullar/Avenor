"use client";

import { CheckCircle2, MessageSquare, XCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";

export interface SlackIntegrationCardProps {
  initialConnected: boolean;
}

type TestState = "idle" | "testing" | "success" | "error";

/**
 * Connect/update/disconnect form for the caller's own Slack Incoming
 * Webhook. The webhook URL is never sent back to the browser once saved,
 * so — same as YouTrack's token — it starts masked when already
 * connected, and the raw input (and Test Webhook) only appear once the
 * user chooses to replace it.
 */
export function SlackIntegrationCard({ initialConnected }: SlackIntegrationCardProps) {
  const [connected, setConnected] = useState(initialConnected);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isEditing, setIsEditing] = useState(!initialConnected);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [testState, setTestState] = useState<TestState>("idle");
  const [testMessage, setTestMessage] = useState("");

  const resetTestState = () => {
    if (testState !== "idle") {
      setTestState("idle");
      setTestMessage("");
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setWebhookUrl("");
    resetTestState();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setWebhookUrl("");
    resetTestState();
  };

  const handleTest = async () => {
    setTestState("testing");
    setTestMessage("");
    try {
      const response = await fetch("/api/integrations/slack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const body: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !body.success) {
        setTestState("error");
        setTestMessage(body.error ?? "Invalid webhook");
        return;
      }
      setTestState("success");
      setTestMessage("Webhook is valid");
    } catch {
      setTestState("error");
      setTestMessage("Could not reach the server to test the webhook.");
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const body: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error ?? "Failed to save Slack webhook.");
      }
      setConnected(true);
      setWebhookUrl("");
      setIsEditing(false);
      resetTestState();
      setMessage({ type: "success", text: "Slack connected." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save Slack webhook.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/slack", { method: "DELETE" });
      const body: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error ?? "Failed to disconnect Slack.");
      }
      setConnected(false);
      setIsEditing(true);
      resetTestState();
      setMessage({ type: "success", text: "Slack disconnected." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to disconnect Slack.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const canTest = !!webhookUrl && testState !== "testing";
  const canSave = testState === "success";

  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader
        title="Slack Integration"
        description="Used to send your reports"
        icon={<MessageSquare className="h-4.5 w-4.5" strokeWidth={2} />}
        iconClassName="bg-emerald-50 text-emerald-600"
        className="border-b-0 pb-0"
        actions={
          <Badge variant={connected ? "success" : "neutral"}>
            {connected ? "Connected" : "Not Connected"}
          </Badge>
        }
      />

      {message && (
        <div
          role={message.type === "error" ? "alert" : "status"}
          className={cn(
            "mt-4 rounded-lg border px-4 py-3 text-sm",
            message.type === "error"
              ? "border-danger/30 bg-danger-subtle text-danger-subtle-foreground"
              : "border-success/30 bg-success-subtle text-success-subtle-foreground"
          )}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={(event) => void handleSave(event)} className="mt-4 flex flex-col gap-4">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Input
              label="Incoming Webhook URL"
              type="password"
              autoComplete="off"
              required
              value={webhookUrl}
              onChange={(event) => {
                setWebhookUrl(event.target.value);
                resetTestState();
              }}
              placeholder="https://hooks.slack.com/services/..."
              hint="Stored encrypted. Never displayed after saving."
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleTest()}
                disabled={!canTest}
                isLoading={testState === "testing"}
              >
                Test Webhook
              </Button>
              {connected && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-muted-foreground hover:text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
              )}
              {testState === "success" && (
                <span className="text-success flex items-center gap-1.5 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                  {testMessage}
                </span>
              )}
              {testState === "error" && (
                <span className="text-danger flex items-center gap-1.5 text-sm font-medium">
                  <XCircle className="h-4 w-4" strokeWidth={2} />
                  {testMessage}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-foreground text-sm font-medium">Incoming Webhook URL</span>
            <div className="border-border bg-muted flex h-10 items-center justify-between gap-3 rounded-lg border px-3">
              <span className="text-muted-foreground text-sm tracking-widest">
                ••••••••••••••••
              </span>
              <button
                type="button"
                onClick={handleStartEdit}
                className="text-primary shrink-0 text-xs font-medium hover:underline"
              >
                Update Webhook
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {isEditing && (
            <Button type="submit" isLoading={isSaving} disabled={!canSave}>
              {connected ? "Update" : "Connect"}
            </Button>
          )}
          {connected && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleDisconnect()}
              isLoading={isDisconnecting}
            >
              Disconnect
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
