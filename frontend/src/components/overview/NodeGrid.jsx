import { Link } from "react-router-dom";
import { useNow } from "../../hooks/useNow";
import { NODE_STATUS, TONE } from "../../utils/labels";
import { formatRelative } from "../../utils/time";
import Sparkline from "../ui/Sparkline";

const ORDER = { DOWN: 0, MAINTENANCE: 1, ACTIVE: 2 };

/** Live wall of nodes: problems first, each with its latency trace. */
function NodeGrid({ nodes }) {
  const now = useNow(2000);
  const sorted = [...nodes].sort(
    (a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3) || a.name.localeCompare(b.name)
  );
  const peak = Math.max(60, ...nodes.flatMap((n) => n.latencyHistory ?? []));

  return (
    <ul className="grid gap-px overflow-hidden rounded-lg border border-fjord-800 bg-fjord-950 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {sorted.map((node) => {
        const meta = NODE_STATUS[node.status] ?? { label: node.status, tone: "muted" };
        const tone = TONE[meta.tone];
        const isDown = node.status === "DOWN";
        return (
          <li key={node.id} className="bg-fjord-900">
            <Link
              to={`/incidents?nodeId=${node.id}`}
              className={`relative flex h-full flex-col gap-3 p-4 transition-colors hover:bg-fjord-850 ${isDown ? "bg-outage/[0.06]" : ""}`}
              aria-label={`${node.name}, ${meta.label}. Show incidents`}
            >
              <span className={`absolute inset-y-0 left-0 w-[3px] ${tone.bg}`} aria-hidden="true" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[17px] font-semibold text-fjord-100">{node.name}</p>
                  <p className="truncate text-sm text-fjord-400">{node.location}</p>
                </div>
                <span className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${tone.text}`}>
                  <span className={`size-2 rounded-full ${tone.bg} ${isDown ? `animate-pulse-ring ${tone.text}` : ""}`} />
                  {meta.label}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div className="text-sm">
                  <p className="font-display text-xl font-semibold whitespace-nowrap text-fjord-100">
                    {isDown || node.latencyMs == null ? "—" : `${node.latencyMs} ms`}
                  </p>
                  <p className="text-xs whitespace-nowrap text-fjord-400">
                    {node.lastHeartbeatAt ? `Seen ${formatRelative(node.lastHeartbeatAt, now)}` : "No heartbeat yet"}
                  </p>
                </div>
                <Sparkline
                  values={node.latencyHistory ?? []}
                  max={peak}
                  width={110}
                  height={32}
                  tone={isDown ? "text-outage" : node.status === "MAINTENANCE" ? "text-caution" : "text-signal"}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default NodeGrid;
