import { Inbox, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  TicketsTable,
  type TicketsTableColumn,
} from "@/features/dashboard/components/TicketsTable";
import type { VerifiedEnvironment, VerifiedTicket } from "@/types/youtrack";

const ENVIRONMENT_BADGE_VARIANT: Record<VerifiedEnvironment, "info" | "warning" | "success"> = {
  DEV: "info",
  STAGE: "warning",
  PROD: "success",
};

const COLUMNS: readonly TicketsTableColumn<VerifiedTicket>[] = [
  { header: "Ticket", render: (ticket) => <span className="font-medium">{ticket.id}</span> },
  { header: "Summary", render: (ticket) => ticket.summary },
  {
    header: "Status",
    render: (ticket) => <span className="text-muted-foreground">{ticket.status}</span>,
  },
  {
    header: "Environment",
    render: (ticket) => (
      <div className="flex flex-wrap gap-1.5">
        {ticket.verifiedEnvironments.map((environment) => (
          <Badge key={environment} variant={ENVIRONMENT_BADGE_VARIANT[environment]}>
            {environment}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    header: "Assignee",
    render: (ticket) => (
      <span className="text-muted-foreground">{ticket.assignee ?? "Unassigned"}</span>
    ),
  },
];

export interface VerifiedTicketsSectionProps {
  /** null = never successfully synced yet (or the sync failed — see the page-level error banner for why). */
  tickets: readonly VerifiedTicket[] | null;
  isLoading: boolean;
}

export function VerifiedTicketsSection({ tickets, isLoading }: VerifiedTicketsSectionProps) {
  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <CardHeader className="border-b-0 p-4">
        <SectionHeader
          as="h3"
          title="Verified Tickets"
          description="Has passed DEV, STAGE, and/or PROD verification"
          icon={<ShieldCheck className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-violet-50 text-violet-600"
          className="border-b-0 pb-0"
        />
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && tickets === null ? (
          <div className="flex justify-center py-14">
            <LoadingSpinner label="Loading verified tickets" />
          </div>
        ) : tickets === null ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" strokeWidth={1.75} />}
            title="Not synced yet"
            description="Click Sync to load verified tickets from YouTrack."
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" strokeWidth={1.75} />}
            title="No verified tickets"
            description="Tickets fetched from YouTrack will appear here"
          />
        ) : (
          <TicketsTable tickets={tickets} columns={COLUMNS} />
        )}
      </CardContent>
    </Card>
  );
}
