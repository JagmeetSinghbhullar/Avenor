import { Inbox, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  TicketsTable,
  type TicketsTableColumn,
} from "@/features/dashboard/components/TicketsTable";
import type { YouTrackTicket } from "@/types/youtrack";

const COLUMNS: readonly TicketsTableColumn<YouTrackTicket>[] = [
  { header: "Ticket", render: (ticket) => <span className="font-medium">{ticket.id}</span> },
  { header: "Summary", render: (ticket) => ticket.summary },
  {
    header: "Status",
    render: (ticket) => <span className="text-muted-foreground">{ticket.status}</span>,
  },
  {
    header: "Assignee",
    render: (ticket) => (
      <span className="text-muted-foreground">{ticket.assignee ?? "Unassigned"}</span>
    ),
  },
];

export interface CreatedTicketsSectionProps {
  /** null = never successfully synced yet (or the sync failed — see the page-level error banner for why). */
  tickets: readonly YouTrackTicket[] | null;
  isLoading: boolean;
}

export function CreatedTicketsSection({ tickets, isLoading }: CreatedTicketsSectionProps) {
  return (
    <Card className="flex flex-col overflow-hidden p-0">
      <CardHeader className="border-b-0 p-4">
        <SectionHeader
          as="h3"
          title="Created Today"
          description="Tickets created today in YouTrack"
          icon={<PlusCircle className="h-4.5 w-4.5" strokeWidth={2} />}
          iconClassName="bg-emerald-50 text-emerald-600"
          className="border-b-0 pb-0"
        />
      </CardHeader>
      <CardContent className="p-0">
        {isLoading && tickets === null ? (
          <div className="flex justify-center py-14">
            <LoadingSpinner label="Loading created tickets" />
          </div>
        ) : tickets === null ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" strokeWidth={1.75} />}
            title="Not synced yet"
            description="Click Sync to load today's created tickets from YouTrack."
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-6 w-6" strokeWidth={1.75} />}
            title="No tickets created today"
            description="Newly created tickets will appear here after syncing"
          />
        ) : (
          <TicketsTable tickets={tickets} columns={COLUMNS} />
        )}
      </CardContent>
    </Card>
  );
}
