import { Settings, Sliders } from "lucide-react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GoogleAccountCard } from "@/features/profile/components/GoogleAccountCard";
import { PersonalInfoCard } from "@/features/profile/components/PersonalInfoCard";
import { SlackIntegrationCard } from "@/features/profile/components/SlackIntegrationCard";
import { YouTrackIntegrationCard } from "@/features/profile/components/YouTrackIntegrationCard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserStatus } from "@/lib/user-status";
import {
  UserIntegrationsService,
  type SlackIntegrationStatus,
  type YouTrackIntegrationStatus,
} from "@/services/user-integrations.service";

const DISCONNECTED_YOUTRACK_STATUS: YouTrackIntegrationStatus = {
  connected: false,
  baseUrl: null,
  project: null,
  stateField: null,
  login: null,
};

const DISCONNECTED_SLACK_STATUS: SlackIntegrationStatus = { connected: false };

export default async function ProfilePage() {
  const status = await getCurrentUserStatus();
  if (!status) {
    redirect("/login");
  }

  const supabase = await createClient();
  const service = new UserIntegrationsService(supabase, status.userId);
  // Reading integration status is not allowed to take the whole page down —
  // a missing table/column (e.g. supabase/schema.sql not yet applied) or a
  // transient DB error should render as "Not Connected", not a 500. This
  // mirrors how getCurrentUserStatus() already treats the same query.
  const [youtrackStatus, slackStatus] = await Promise.all([
    service.getYouTrackStatus().catch((error: unknown) => {
      console.error("Profile: failed to load YouTrack integration status", error);
      return DISCONNECTED_YOUTRACK_STATUS;
    }),
    service.getSlackStatus().catch((error: unknown) => {
      console.error("Profile: failed to load Slack integration status", error);
      return DISCONNECTED_SLACK_STATUS;
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profile" description="Manage your account and integrations" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PersonalInfoCard name={status.name} email={status.email} avatarUrl={status.avatarUrl} />
        <GoogleAccountCard email={status.email} />
      </div>

      <YouTrackIntegrationCard initialStatus={youtrackStatus} />
      <SlackIntegrationCard initialConnected={slackStatus.connected} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ComingSoonCard
          title="Preferences"
          description="Theme, notifications, and other personal settings — coming soon."
          icon={<Sliders className="h-4.5 w-4.5" strokeWidth={2} />}
        />
        <ComingSoonCard
          title="Account Settings"
          description="Manage your account and data — coming soon."
          icon={<Settings className="h-4.5 w-4.5" strokeWidth={2} />}
        />
      </div>
    </div>
  );
}

interface ComingSoonCardProps {
  title: string;
  description: string;
  icon: ReactNode;
}

/** Honest placeholder, not a fake interactive section — these areas simply don't exist yet. */
function ComingSoonCard({ title, description, icon }: ComingSoonCardProps) {
  return (
    <Card className="p-4 opacity-75 sm:p-6">
      <SectionHeader
        title={title}
        icon={icon}
        iconClassName="bg-muted text-muted-foreground"
        className="border-b-0 pb-0"
      />
      <p className="text-muted-foreground mt-4 text-sm">{description}</p>
    </Card>
  );
}
