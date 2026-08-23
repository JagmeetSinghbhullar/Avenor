import type { ReactNode } from "react";
import type { YouTrackTicket } from "@/types/youtrack";

export interface TicketsTableColumn<T extends YouTrackTicket> {
  /** Usually a string, but can be a Checkbox element (e.g. a "select all" header cell). */
  header: ReactNode;
  render: (ticket: T) => ReactNode;
}

export interface TicketsTableProps<T extends YouTrackTicket> {
  tickets: readonly T[];
  columns: readonly TicketsTableColumn<T>[];
}

/**
 * Shared table shell for any list of YouTrackTicket-shaped rows — column
 * set is the only thing that varies per use. No outer border/radius of its
 * own — it's meant to sit directly inside a Card, which provides that.
 * Caps at a scrollable height with a sticky header once a list gets long.
 */
export function TicketsTable<T extends YouTrackTicket>({ tickets, columns }: TicketsTableProps<T>) {
  return (
    <div className="max-h-[28rem] overflow-auto rounded-b-xl">
      <table className="w-full text-left text-sm">
        <thead className="border-border bg-surface/95 sticky top-0 z-10 border-b backdrop-blur-sm">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="text-muted-foreground px-4 py-2.5 text-xs font-semibold tracking-wide uppercase"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-border/70 divide-y">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-muted/50 transition-colors duration-150">
              {columns.map((column, index) => (
                <td key={index} className="text-foreground px-4 py-3">
                  {column.render(ticket)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
