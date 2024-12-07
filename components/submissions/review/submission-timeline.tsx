// components/submissions/review/submission-timeline.tsx

interface TimelineEvent {
  id: string;
  action: string;
  performed_by_name: string;
  performed_at: string;
  details?: any;
  renderDetails?: React.ReactNode;
}

interface TimelineProps {
  events: TimelineEvent[];
}

function getActionIcon(action: string) {
  switch (action) {
    case "created":
      return "📝";
    case "submitted":
      return "📤";
    case "approved":
      return "✅";
    case "rejected":
      return "❌";
    case "updated":
      return "📝";
    default:
      return "📋";
  }
}

function getActionColor(action: string) {
  switch (action) {
    case "created":
      return "text-blue-500";
    case "submitted":
      return "text-yellow-500";
    case "approved":
      return "text-green-500";
    case "rejected":
      return "text-red-500";
    case "updated":
      return "text-purple-500";
    default:
      return "text-gray-500";
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

export function SubmissionTimeline({ events }: TimelineProps) {
  console.log(events);

  return (
    <div className="space-y-8">
      {events.map((event, index) => (
        <div key={event.id} className="relative">
          {/* Vertical line connecting events */}
          {index !== events.length - 1 && (
            <div className="absolute left-[15px] top-[30px] h-full w-[2px] bg-gray-200" />
          )}

          <div className="flex items-start space-x-4">
            {/* Timeline dot */}
            <div
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white ${getActionColor(
                event.action
              )}`}
            >
              <span className="text-lg">{getActionIcon(event.action)}</span>
            </div>

            {/* Event content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {event.action.charAt(0).toUpperCase() + event.action.slice(1)}
                </p>
                <time className="text-sm text-muted-foreground">
                  {formatDate(event.performed_at)}
                </time>
              </div>

              <p className="text-sm text-muted-foreground">
                by {event.performed_by_name}
              </p>

              {/* Additional details */}
              {event.renderDetails ? (
                <div className="mt-4">
                  {event.renderDetails as React.ReactNode}
                </div>
              ) : (
                event.details && (
                  <div className="mt-2 rounded-md bg-muted p-3">
                    {event.action === "rejected" && (
                      <p className="text-sm">
                        <span className="font-medium">Reason: </span>
                        {event.details.reason}
                      </p>
                    )}
                    {event.action === "updated" && (
                      <p className="text-sm">
                        <span className="font-medium">Changes: </span>
                        {event.details.changes}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
