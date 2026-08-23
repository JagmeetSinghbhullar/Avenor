"use client";

import { CheckCircle2, GitBranch, XCircle } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { cn } from "@/lib/cn";
import type { YouTrackIntegrationStatus } from "@/services/user-integrations.service";

export interface YouTrackIntegrationCardProps {
  initialStatus: YouTrackIntegrationStatus;
}

type TestState = "idle" | "testing" | "success" | "error";

/**
 * Connect/update/disconnect form for the caller's own YouTrack credentials.
 * Deliberately does not touch anything related to actually syncing tickets —
 * that's a later step.
 *
 * The API Token is never sent back to the browser once saved (it's only
 * ever readable server-side, via Vault). So when already connected, the
 * token field starts masked and the raw input only appears once the user
 * explicitly chooses to replace it — and because we then have a real
 * plaintext token in hand client-side, that's also the only moment a
 * fresh "Test Connection" can run. Editing Base URL/Project/Login/State
 * Field without touching the token doesn't require re-testing, since
 * that would need re-sending a token we deliberately never exposed.
 */
export function YouTrackIntegrationCard({ initialStatus }: YouTrackIntegrationCardProps) {
  const [status, setStatus] = useState(initialStatus);
  const [baseUrl, setBaseUrl] = useState(initialStatus.baseUrl ?? "");
  const [project, setProject] = useState(initialStatus.project ?? "");
  const [stateField, setStateField] = useState(initialStatus.stateField ?? "");
  const [login, setLogin] = useState(initialStatus.login ?? "");
  const [apiToken, setApiToken] = useState("");
  const [isEditingToken, setIsEditingToken] = useState(!initialStatus.connected);
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

  const handleStartEditToken = () => {
    setIsEditingToken(true);
    setApiToken("");
    resetTestState();
  };

  const handleCancelEditToken = () => {
    setIsEditingToken(false);
    setApiToken("");
    resetTestState();
  };

  const handleTest = async () => {
    setTestState("testing");
    setTestMessage("");
    try {
      const response = await fetch("/api/integrations/youtrack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, project, login, apiToken }),
      });
      const body: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !body.success) {
        setTestState("error");
        setTestMessage(body.error ?? "Authentication failed.");
        return;
      }
      setTestState("success");
      setTestMessage("Connection successful");
    } catch {
      setTestState("error");
      setTestMessage("Could not reach the server to test the connection.");
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/youtrack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          project,
          stateField,
          login,
          apiToken: isEditingToken ? apiToken || undefined : undefined,
        }),
      });
      const body: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error ?? "Failed to save YouTrack settings.");
      }
      setStatus({ connected: true, baseUrl, project, stateField, login });
      setApiToken("");
      setIsEditingToken(false);
      resetTestState();
      setMessage({ type: "success", text: "YouTrack connected." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to save YouTrack settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setMessage(null);
    try {
      const response = await fetch("/api/integrations/youtrack", { method: "DELETE" });
      const body: { success?: boolean; error?: string } = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error ?? "Failed to disconnect YouTrack.");
      }
      setStatus({ connected: false, baseUrl: null, project: null, stateField: null, login: null });
      setBaseUrl("");
      setProject("");
      setStateField("");
      setLogin("");
      setApiToken("");
      setIsEditingToken(true);
      resetTestState();
      setMessage({ type: "success", text: "YouTrack disconnected." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to disconnect YouTrack.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const canTest = !!(baseUrl && project && login && apiToken) && testState !== "testing";
  const canSave = isEditingToken ? testState === "success" : true;

  return (
    <Card className="p-4 sm:p-6">
      <SectionHeader
        title="YouTrack Integration"
        description="Used to sync only your tickets"
        icon={<GitBranch className="h-4.5 w-4.5" strokeWidth={2} />}
        iconClassName="bg-sky-50 text-sky-600"
        className="border-b-0 pb-0"
        actions={
          <Badge variant={status.connected ? "success" : "neutral"}>
            {status.connected ? "Connected" : "Not Connected"}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Base URL"
            required
            value={baseUrl}
            onChange={(event) => {
              setBaseUrl(event.target.value);
              resetTestState();
            }}
            placeholder="https://yourteam.youtrack.cloud"
          />
          <Input
            label="Project"
            required
            value={project}
            onChange={(event) => {
              setProject(event.target.value);
              resetTestState();
            }}
            placeholder="e.g. ARD"
          />
          <Input
            label="YouTrack Login"
            required
            value={login}
            onChange={(event) => {
              setLogin(event.target.value);
              resetTestState();
            }}
            placeholder="Your YouTrack username"
            hint="Used to filter tickets down to only yours"
          />
          <Input
            label="State Field"
            value={stateField}
            onChange={(event) => setStateField(event.target.value)}
            placeholder="State"
            hint="Optional — defaults to “State”"
          />
        </div>

        {isEditingToken ? (
          <div className="flex flex-col gap-2">
            <Input
              label="API Token"
              type="password"
              autoComplete="off"
              value={apiToken}
              onChange={(event) => {
                setApiToken(event.target.value);
                resetTestState();
              }}
              placeholder="perm:..."
              hint="Stored encrypted. Never displayed after saving."
              required={!status.connected}
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
                Test Connection
              </Button>
              {status.connected && (
                <button
                  type="button"
                  onClick={handleCancelEditToken}
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
            <span className="text-foreground text-sm font-medium">API Token</span>
            <div className="border-border bg-muted flex h-10 items-center justify-between gap-3 rounded-lg border px-3">
              <span className="text-muted-foreground text-sm tracking-widest">
                ••••••••••••••••
              </span>
              <button
                type="button"
                onClick={handleStartEditToken}
                className="text-primary shrink-0 text-xs font-medium hover:underline"
              >
                Update Token
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSaving} disabled={!canSave}>
            {status.connected ? "Update" : "Connect"}
          </Button>
          {status.connected && (
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
