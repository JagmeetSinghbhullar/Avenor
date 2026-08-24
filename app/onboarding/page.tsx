import { BadgeCheck, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { getCurrentUserStatus } from "@/lib/user-status";

/**
 * Shown after first sign-in until YouTrack is connected — see
 * DashboardLayout, which redirects here for exactly that condition.
 * Slack is deliberately NOT part of this screen: it's optional, and
 * connecting it happens later from the Profile page — see the dashboard,
 * which disables just the Send Report action until Slack is connected
 * rather than gating the whole dashboard on it.
 *
 * A standalone route (not nested under app/dashboard), styled like
 * /login (centered card, no sidebar/topbar chrome) since it's the same
 * kind of focused, single-purpose setup screen.
 */
export default async function OnboardingPage() {
  const status = await getCurrentUserStatus();

  if (!status) {
    redirect("/login");
  }

  if (status.youtrackConnected) {
    redirect("/dashboard");
  }

  const firstName = status.name.split(" ")[0];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
            <BadgeCheck className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Welcome, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Before using Avenor, connect your YouTrack account.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" strokeWidth={2} />
            <span className="text-sm font-medium text-foreground">Google Connected</span>
          </div>

          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium",
              "text-foreground transition-colors duration-150 hover:border-border-strong hover:bg-muted"
            )}
          >
            <Circle className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={2} />
            <span className="flex-1">Connect YouTrack</span>
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          You&apos;ll land on the dashboard automatically once YouTrack is connected. Slack is
          optional and can be connected any time from your profile.
        </p>
      </Card>
    </div>
  );
}
