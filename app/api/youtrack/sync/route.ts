import { NextResponse } from "next/server";
import { YouTrackService, YouTrackServiceError } from "@/services/youtrack.service";

/**
 * The only place YouTrackService is ever called from. It needs
 * YOUTRACK_API_TOKEN, which must never reach the browser, so client code
 * (the Sync button, the dashboard) calls this route instead of the
 * service directly.
 */
export async function POST() {
  try {
    const service = new YouTrackService();
    const result = await service.sync();
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof YouTrackServiceError) {
      // This branch previously returned without logging anything — the
      // client got a message, but the terminal showed nothing beyond
      // Next.js's own "POST /api/youtrack/sync 500" line, which is why
      // the real cause wasn't visible. Every failure path now logs here.
      console.error("YouTrack sync failed:", error.message, {
        status: error.status,
        cause: error.cause,
      });
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error during YouTrack sync", error);
    return NextResponse.json(
      { error: "Unexpected server error during YouTrack sync." },
      { status: 500 }
    );
  }
}
