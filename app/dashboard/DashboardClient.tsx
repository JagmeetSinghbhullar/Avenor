"use client";

import {
  CheckCircle2,
  Clock,
  Cpu,
  Calendar as DateIcon,
  FileText,
  GitBranch,
  MessageSquare,
  Monitor,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Textarea } from "@/components/ui/Textarea";
import { CreatedTicketsSection } from "@/features/dashboard/components/CreatedTicketsSection";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import { VerifiedTicketsSection } from "@/features/dashboard/components/VerifiedTicketsSection";
import { BuildInfoForm } from "@/features/report/components/BuildInfoForm";
import { DraftStatusBar } from "@/features/report/components/DraftStatusBar";
import { ReportPreview } from "@/features/report/components/ReportPreview";
import { TestedFlowsTree } from "@/features/report/components/TestedFlowsTree";
import { useReportDraft, type ReportDraftInit } from "@/features/report/hooks/useReportDraft";
import { buildReportContent } from "@/features/report/lib/buildReportContent";
import { useYouTrackSync } from "@/hooks/useYouTrackSync";
import { getSelectableFlows } from "@/lib/flows";

/** FLOWS is a static catalog (Feature 1) — safe to compute this once at module scope. */
const TOTAL_SELECTABLE_FLOWS = getSelectableFlows().length;

function formatSyncTime(iso: string | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

type SendState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; message?: string }
  | { status: "error"; message: string };

export interface DashboardClientProps {
  /**
   * Slack is optional: this component always renders regardless of
   * whether it's connected, and just swaps the Send Report action for a
   * "not connected" card.
   */
  slackConnected: boolean;
  /**
   * The server layout already redirects to /onboarding when YouTrack
   * isn't connected, so this is normally always true by the time this
   * component renders — it's here as defense-in-depth against a stale
   * client (e.g. disconnected in another tab) rather than as the primary
   * gate. When false, no sync call is ever made and the ticket sections
   * show a connect-prompt instead.
   */
  youtrackConnected: boolean;
  /** The user's saved report draft, loaded server-side, so it's restored on first paint after login. */
  initialDraft?: ReportDraftInit;
}

export default function DashboardClient({
  slackConnected,
  youtrackConnected,
  initialDraft,
}: DashboardClientProps) {
  const { data, isLoading, error, sync } = useYouTrackSync(youtrackConnected);
  const draft = useReportDraft(initialDraft);
  const [sendState, setSendState] = useState<SendState>({ status: "idle" });

  // formatTodayDate() calls toLocaleDateString(), whose output depends on
  // the runtime's locale/timezone resolution. That can legitimately differ
  // between the server (Node) and the browser, so computing it directly
  // during render caused a hydration mismatch — the server-rendered string
  // didn't match what the client computed on hydration. Deferring it to an
  // effect means both the server render and the initial client render show
  // the same empty string (no mismatch possible), and the real date is
  // filled in immediately after mount, client-side only.
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: see comment above `today` state.
    setToday(formatTodayDate());
  }, []);

  const reportContent = useMemo(
    () =>
      buildReportContent({
        buildNumber: draft.buildNumber,
        environment: draft.environment,
        notes: draft.notes,
        selectedFlowIds: draft.selectedFlowIds,
        manualFlows: draft.manualFlows,
        // All fetched tickets are included automatically — no selection.
        createdTickets: data?.createdToday ?? [],
        verifiedTickets: data?.verifiedTickets ?? [],
      }),
    [
      draft.buildNumber,
      draft.environment,
      draft.notes,
      draft.selectedFlowIds,
      draft.manualFlows,
      data,
    ]
  );

  const handleSendReport = async () => {
    setSendState({ status: "sending" });
    try {
      const response = await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reportContent }),
      });
      const body: { success?: boolean; warning?: string; error?: string } = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error ?? "Failed to send report.");
      }
      setSendState({ status: "sent", message: body.warning });
    } catch (err) {
      setSendState({
        status: "error",
        message: err instanceof Error ? err.message : "Failed to send report.",
      });
    }
  };

  const totalFlowsAvailable = TOTAL_SELECTABLE_FLOWS + draft.manualFlows.length;

  // A ticket can be verified on more than one environment at once (see
  // VerifiedTicket), so these counts overlap by design — they're not a
  // three-way split of one total.
  const verifiedCounts = useMemo(() => {
    const tickets = data?.verifiedTickets ?? [];
    return {
      dev: tickets.filter((ticket) => ticket.verifiedEnvironments.includes("DEV")).length,
      stage: tickets.filter((ticket) => ticket.verifiedEnvironments.includes("STAGE")).length,
      prod: tickets.filter((ticket) => ticket.verifiedEnvironments.includes("PROD")).length,
    };
  }, [data]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Track your QA testing overview"
        actions={
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <DateIcon className="h-4 w-4" strokeWidth={2} />
              {today}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={2} />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-muted-foreground">Last Sync</span>
                <span className="text-sm font-medium text-foreground">
                  {formatSyncTime(data?.syncedAt)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => void sync()}
              isLoading={isLoading}
              disabled={!youtrackConnected}
              leftIcon={<RefreshCw className="h-4 w-4" strokeWidth={2} />}
            >
              Sync
            </Button>
          </div>
        }
      />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger-subtle-foreground"
        >
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        <SummaryCard
          label="DEV Verified"
          value={data ? verifiedCounts.dev : "—"}
          description="Moved In DEV → Ready for Stage"
          icon={<ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-sky-50 text-sky-600"
          isLoading={isLoading && !data}
        />
        <SummaryCard
          label="STAGE Verified"
          value={data ? verifiedCounts.stage : "—"}
          description="Moved Stage → Ready for Prod"
          icon={<ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-amber-50 text-amber-600"
          isLoading={isLoading && !data}
        />
        <SummaryCard
          label="PROD Verified"
          value={data ? verifiedCounts.prod : "—"}
          description="Moved Prod → Verified"
          icon={<ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-emerald-50 text-emerald-600"
          isLoading={isLoading && !data}
        />
        <SummaryCard
          label="Created Tickets"
          value={data?.createdToday.length ?? "—"}
          description="Created today in YouTrack"
          icon={<PlusCircle className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-emerald-50 text-emerald-600"
          isLoading={isLoading && !data}
        />
        <SummaryCard
          label="Tested Flows"
          value={`${draft.selectedFlowIds.size} / ${totalFlowsAvailable}`}
          description="Selected from test flows"
          icon={<Waypoints className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-sky-50 text-sky-600"
        />
        <SummaryCard
          label="Build Number"
          value={draft.buildNumber || "Not set"}
          description="Application build"
          icon={<Cpu className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-orange-50 text-orange-600"
        />
        <SummaryCard
          label="Environment"
          value={draft.environment || "Not set"}
          description="Target environment"
          icon={<Monitor className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-blue-50 text-blue-600"
        />
        <SummaryCard
          label="Last Sync"
          value={formatSyncTime(data?.syncedAt)}
          description={today && `Today, ${today}`}
          icon={<Clock className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-pink-50 text-pink-600"
        />
      </section>

      {youtrackConnected ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <VerifiedTicketsSection tickets={data?.verifiedTickets ?? null} isLoading={isLoading} />
          <CreatedTicketsSection tickets={data?.createdToday ?? null} isLoading={isLoading} />
        </div>
      ) : (
        <Card className="p-0">
          <EmptyState
            icon={<GitBranch className="h-6 w-6" strokeWidth={1.75} />}
            title="YouTrack not connected"
            description="Connect your YouTrack account to start syncing tickets."
            action={
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:from-indigo-700 hover:to-purple-700 hover:shadow-md"
              >
                Open Profile
              </Link>
            }
          />
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <TestedFlowsTree
          selectedFlowIds={draft.selectedFlowIds}
          manualFlows={draft.manualFlows}
          onToggleFlow={draft.toggleFlowSelection}
          onAddManualFlow={draft.addManualFlow}
          onRemoveManualFlow={draft.removeManualFlow}
        />

        <div className="flex flex-col gap-6">
          <BuildInfoForm
            buildNumber={draft.buildNumber}
            onBuildNumberChange={draft.setBuildNumber}
            environment={draft.environment}
            onEnvironmentChange={draft.setEnvironment}
          />

          <Card className="p-4 sm:p-6">
            <SectionHeader
              title="Notes"
              icon={<FileText className="h-4.5 w-4.5" strokeWidth={2} />}
              iconClassName="bg-muted text-muted-foreground"
              className="border-b-0 pb-0"
            />
            <Textarea
              aria-label="Notes"
              placeholder="Free text notes about today's testing..."
              value={draft.notes}
              onChange={(event) => draft.setNotes(event.target.value)}
              rows={5}
              className="mt-4"
            />
            <p className="mt-1.5 text-right text-xs text-muted-foreground">
              {draft.notes.length} / 1000
            </p>
          </Card>

          <DraftStatusBar
            status={draft.saveStatus}
            lastSavedAt={draft.lastSavedAt}
            onSaveDraft={() => void draft.saveDraft()}
          />

          <ReportPreview content={reportContent} />

          {slackConnected ? (
            <div className="flex flex-col gap-3">
              {sendState.status === "sent" && (
                <div
                  role="status"
                  className="rounded-lg border border-success/30 bg-success-subtle px-4 py-3 text-sm text-success-subtle-foreground"
                >
                  {sendState.message ?? "Report saved and sent to Slack."}
                </div>
              )}
              {sendState.status === "error" && (
                <div
                  role="alert"
                  className="rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger-subtle-foreground"
                >
                  {sendState.message}
                </div>
              )}
              <Button
                onClick={() => void handleSendReport()}
                isLoading={sendState.status === "sending"}
                disabled={!draft.buildNumber || !draft.environment}
                size="lg"
                fullWidth
              >
                Send Report
              </Button>
            </div>
          ) : (
            <Card className="flex items-center gap-4 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <MessageSquare className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Slack not connected</p>
                <p className="text-sm text-muted-foreground">Connect Slack to send reports.</p>
              </div>
              <Link
                href="/profile"
                className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:from-indigo-700 hover:to-purple-700 hover:shadow-md"
              >
                Connect Slack
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
