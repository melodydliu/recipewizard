import Link from "next/link";
import { Plus, Calendar, ChevronRight } from "lucide-react";
import { getEvents } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewEventDialog } from "@/components/events/new-event-dialog";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  proposal_sent: "Proposal Sent",
  confirmed: "Confirmed",
  completed: "Completed",
  archived: "Archived",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  proposal_sent: "secondary",
  confirmed: "default",
  completed: "secondary",
  archived: "outline",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(n: string | null | undefined) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(n));
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Events</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NewEventDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          }
        />
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <div className="text-muted-foreground rounded-lg border border-dashed p-16 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 opacity-40" />
          <p className="font-display text-lg">No events yet</p>
          <p className="mt-1 text-sm">Create your first event to get started.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="px-4 py-3 text-left font-medium">Event</th>
                <th className="px-4 py-3 text-left font-medium">Client</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="tabular-nums px-4 py-3 text-right font-medium">Total</th>
                <th className="w-8 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <tr
                  key={event.id}
                  className={`hover:bg-muted/30 transition-colors ${i < events.length - 1 ? "border-b" : ""}`}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="font-medium hover:underline"
                    >
                      {event.name}
                    </Link>
                  </td>
                  <td className="text-muted-foreground px-4 py-3">
                    {event.client_name ?? "—"}
                  </td>
                  <td className="text-muted-foreground tabular-nums px-4 py-3">
                    {formatDate(event.event_date)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[event.status] ?? "outline"}>
                      {statusLabel[event.status] ?? event.status}
                    </Badge>
                  </td>
                  <td className="tabular-nums px-4 py-3 text-right font-medium">
                    {"grand_total" in event ? formatCurrency(event.grand_total as string) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/events/${event.id}`}>
                      <ChevronRight className="text-muted-foreground h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
