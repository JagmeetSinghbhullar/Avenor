import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SupabaseService, SupabaseServiceError, type ReportDraftData } from "@/services/supabase.service";
import type { ManualFlow } from "@/types/flow";

interface SaveDraftBody {
  buildNumber?: unknown;
  environment?: unknown;
  notes?: unknown;
  selectedFlowIds?: unknown;
  manualFlows?: unknown;
}

function isManualFlow(value: unknown): value is ManualFlow {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const flow = value as Record<string, unknown>;
  return (
    typeof flow.id === "string" &&
    typeof flow.name === "string" &&
    typeof flow.category === "string" &&
    typeof flow.createdAt === "string"
  );
}

/**
 * Autosaved by useReportDraft as the user types — always a full replace
 * of the caller's one draft row, never a partial patch. This is the only
 * writer of report_drafts; nothing here ever touches the durable
 * `reports` table.
 */
export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  let body: SaveDraftBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body.buildNumber !== "string" ||
    typeof body.environment !== "string" ||
    typeof body.notes !== "string" ||
    !Array.isArray(body.selectedFlowIds) ||
    !body.selectedFlowIds.every((id) => typeof id === "string") ||
    !Array.isArray(body.manualFlows) ||
    !body.manualFlows.every(isManualFlow)
  ) {
    return NextResponse.json({ error: "Invalid draft payload." }, { status: 400 });
  }

  const draft: ReportDraftData = {
    buildNumber: body.buildNumber,
    environment: body.environment as ReportDraftData["environment"],
    notes: body.notes,
    selectedFlowIds: body.selectedFlowIds,
    manualFlows: body.manualFlows,
  };

  try {
    const service = new SupabaseService(supabase);
    await service.saveReportDraft(user.id, draft);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof SupabaseServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error saving report draft", error);
    return NextResponse.json({ error: "Unexpected error saving report draft." }, { status: 500 });
  }
}
