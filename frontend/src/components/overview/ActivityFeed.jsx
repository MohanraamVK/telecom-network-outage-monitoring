import { Link } from "react-router-dom";
import { useNow } from "../../hooks/useNow";
import { describeEvent, EVENT_DOT } from "../../utils/events";
import { formatRelative } from "../../utils/time";

function ActivityFeed({ events }) {
  const now = useNow(15000);

  if (!events.length) {
    return <p className="px-1 py-6 text-sm text-fjord-400">Nothing has happened yet. Changes to incidents show up here.</p>;
  }

  return (
    <ol className="relative space-y-1">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            to={`/incidents?open=${event.incidentId}`}
            className="flex gap-3 rounded-md px-2 py-2.5 hover:bg-fjord-850"
          >
            <span className={`mt-1.5 size-2 shrink-0 rounded-full ${EVENT_DOT[event.type] ?? "bg-fjord-400"}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 text-sm">
              <span className="text-fjord-100">
                <span className="font-semibold">{event.actor}</span> {describeEvent(event)}
              </span>
              <span className="block truncate text-fjord-400">
                {event.nodeName}: {event.type === "NOTE" || event.type.startsWith("AUTO") ? event.message : event.incidentDescription}
              </span>
            </span>
            <time className="shrink-0 text-xs text-fjord-400" dateTime={event.createdAt}>
              {formatRelative(event.createdAt, now)}
            </time>
          </Link>
        </li>
      ))}
    </ol>
  );
}

export default ActivityFeed;
