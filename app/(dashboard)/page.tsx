"use client";

import {
  CheckCircle2,
  Clock,
  Cpu,
  Calendar as DateIcon,
  FileText,
  Monitor,
  PlusCircle,
  RefreshCw,
  ShieldCheck,
  Waypoints,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Textarea } from "@/components/ui/Textarea";
import { CreatedTicketsSection } from "@/features/dashboard/components/CreatedTicketsSection";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import { VerifiedTicketsSection } from "@/features/dashboard/components/VerifiedTicketsSection";
import { BuildInfoForm } from "@/features/report/components/BuildInfoForm";
import { ReportPreview } from "@/features/report/components/ReportPreview";
import { TestedFlowsTree } from "@/features/report/components/TestedFlowsTree";
import { useReportDraft } from "@/features/report/hooks/useReportDraft";
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

export default function DashboardPage() {
  const { data, isLoading, error, sync } = useYouTrackSync();
  const draft = useReportDraft();
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Track your QA testing overview"
        actions={
          <div className="flex flex-wrap items-center gap-5">
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <DateIcon className="h-4 w-4" strokeWidth={2} />
              {today}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="text-success h-4 w-4" strokeWidth={2} />
              <div className="flex flex-col leading-tight">
                <span className="text-muted-foreground text-xs">Last Sync</span>
                <span className="text-foreground text-sm font-medium">
                  {formatSyncTime(data?.syncedAt)}
                </span>
              </div>
            </div>
            <Button
              onClick={() => void sync()}
              isLoading={isLoading}
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
          className="border-danger/30 bg-danger-subtle text-danger-subtle-foreground rounded-lg border px-4 py-3 text-sm"
        >
          {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryCard
          label="Verified Tickets"
          value={data?.verifiedTickets.length ?? "—"}
          description="Current status in DEV, STAGE or PROD verified"
          icon={<ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-violet-50 text-violet-600"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <VerifiedTicketsSection tickets={data?.verifiedTickets ?? null} isLoading={isLoading} />
        <CreatedTicketsSection tickets={data?.createdToday ?? null} isLoading={isLoading} />
      </div>

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
            <p className="text-muted-foreground mt-1.5 text-right text-xs">
              {draft.notes.length} / 1000
            </p>
          </Card>

          <ReportPreview content={reportContent} />

          <div className="flex flex-col gap-3">
            {sendState.status === "sent" && (
              <div
                role="status"
                className="border-success/30 bg-success-subtle text-success-subtle-foreground rounded-lg border px-4 py-3 text-sm"
              >
                {sendState.message ?? "Report saved and sent to Slack."}
              </div>
            )}
            {sendState.status === "error" && (
              <div
                role="alert"
                className="border-danger/30 bg-danger-subtle text-danger-subtle-foreground rounded-lg border px-4 py-3 text-sm"
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
        </div>
      </div>
    </div>
  );
}
