import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import BarChart from "../components/charts/BarChart";
import { durationTicks } from "../components/charts/chartUtils";
import LineChart from "../components/charts/LineChart";
import { NodeStatusBadge } from "../components/ui/Badge";
import { ErrorBanner, Skeleton } from "../components/ui/Feedback";
import { Segmented } from "../components/ui/Toolbar";
import { useLiveRefresh } from "../context/LiveContext";
import { useReload } from "../hooks/useReload";
import { getAnalytics } from "../services/analyticsService";
import { errorMessage } from "../services/errors";
import { formatDuration } from "../utils/time";

const RANGES = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const pct = (value, digits = 2) => `${Number(value).toFixed(digits)}%`;

function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await getAnalytics(days));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Analytics could not be loaded."));
    }
  }, [days]);

  useReload(load);
  useLiveRefresh(["node.changed", "incident.changed"], load, 2000);

  const ready = data && data.days === days;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-fjord-400">Uptime against the SLA, and how incidents trend over time.</p>
        </div>
        <Segmented label="Time range" value={days} onChange={setDays} options={RANGES} />
      </header>

      {error ? <ErrorBanner onRetry={load}>{error}</ErrorBanner> : null}

      {!ready ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          <Summary data={data} />

          <section aria-labelledby="availability-heading" className="rounded-lg border border-fjord-800 bg-fjord-900 p-5">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="availability-heading" className="font-display text-lg font-semibold">Network availability per day</h2>
              <p className="flex items-center gap-2 text-sm text-fjord-400">
                <span className="w-5 border-t border-dashed border-caution" aria-hidden="true" />
                {data.slaTargetPercent}% SLA target. Planned maintenance is excluded.
              </p>
            </div>
            <LineChart
              label="Network availability per day"
              points={data.daily.map((d) => ({ date: d.date, value: d.availabilityPercent }))}
              domain={availabilityDomain(data)}
              target={data.slaTargetPercent}
              format={(v) => pct(v)}
              tickFormat={(v) => pct(v, 1)}
            />
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section aria-labelledby="incidents-heading" className="min-w-0 rounded-lg border border-fjord-800 bg-fjord-900 p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="incidents-heading" className="font-display text-lg font-semibold">Incidents per day</h2>
                <Legend items={[{ label: "Opened", tone: "bg-outage" }, { label: "Resolved", tone: "bg-signal" }]} />
              </div>
              <BarChart
                label="Incidents opened and resolved per day"
                rows={data.daily.map((d) => ({ date: d.date, opened: d.incidentsOpened, resolved: d.incidentsResolved }))}
                series={[
                  { key: "opened", label: "Opened", tone: "outage" },
                  { key: "resolved", label: "Resolved", tone: "signal" },
                ]}
              />
            </section>

            <section aria-labelledby="mttr-heading" className="min-w-0 rounded-lg border border-fjord-800 bg-fjord-900 p-5">
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="mttr-heading" className="font-display text-lg font-semibold">Time to resolve</h2>
                <p className="text-sm text-fjord-400">Average per day, for incidents resolved that day</p>
              </div>
              <BarChart
                label="Average time to resolve per day"
                rows={data.daily.map((d) => ({ date: d.date, mttr: d.mttrMinutes }))}
                series={[{ key: "mttr", label: "Average", tone: "notice" }]}
                format={(v) => formatDuration(v)}
                tickValues={(max) => durationTicks(max)}
                minTop={30}
                emptyText="Nothing resolved"
              />
            </section>
          </div>

          <NodeUptimeTable data={data} />
        </>
      )}
    </div>
  );
}

function availabilityDomain(data) {
  const lowest = Math.min(data.slaTargetPercent, ...data.daily.map((d) => d.availabilityPercent));
  const floor = Math.max(0, Math.floor((lowest - 0.25) * 4) / 4);
  return [floor, 100];
}

function Summary({ data }) {
  const meeting = data.nodes.filter((n) => n.meetsSla).length;
  const breaching = data.nodes.length - meeting;
  return (
    <section aria-label="Summary">
      <p className="max-w-3xl text-[17px] leading-relaxed text-fjord-300">
        Over the last {data.days} days the network was available{" "}
        <span className="font-semibold text-fjord-100">{pct(data.networkAvailabilityPercent, 3)}</span> of the time.{" "}
        {breaching === 0 ? (
          <>All {data.nodes.length} nodes meet the {data.slaTargetPercent}% SLA target.</>
        ) : (
          <>
            <span className="font-semibold text-outage">
              {breaching} of {data.nodes.length} nodes
            </span>{" "}
            {breaching === 1 ? "is" : "are"} below the {data.slaTargetPercent}% SLA target over 30 days.
          </>
        )}
      </p>
      <dl className="mt-5 grid grid-cols-2 divide-fjord-800 rounded-lg border border-fjord-800 sm:grid-cols-4 sm:divide-x">
        <Stat label="Node downtime" value={formatDuration(data.downtimeMinutes)} />
        <Stat label="Incidents opened" value={data.incidentsOpened} />
        <Stat label="Incidents resolved" value={data.incidentsResolved} />
        <Stat label="Average time to resolve" value={formatDuration(data.mttrMinutes)} />
      </dl>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-sm text-fjord-400">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-fjord-100">
        {value}
      </dd>
    </div>
  );
}

function Legend({ items }) {
  return (
    <ul className="flex gap-4 text-sm text-fjord-300">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span className={`size-2.5 rounded-sm ${item.tone}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function UptimeCell({ value, target }) {
  const below = value < target;
  return (
    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${below ? "text-outage" : "text-fjord-100"}`}>
      {pct(value)}
    </td>
  );
}

function NodeUptimeTable({ data }) {
  return (
    <section aria-labelledby="uptime-heading" className="overflow-hidden rounded-lg border border-fjord-800 bg-fjord-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5 pb-3">
        <h2 id="uptime-heading" className="font-display text-lg font-semibold">Uptime by node</h2>
        <p className="text-sm text-fjord-400">Lowest uptime first. SLA is judged on the last 30 days.</p>
      </div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-y border-fjord-800 text-fjord-400">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Node</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">24 hours</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">7 days</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">30 days</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Downtime ({data.days}d)</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Outages</th>
              <th scope="col" className="px-4 py-3 font-medium">SLA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fjord-800">
            {data.nodes.map((node) => (
              <tr key={node.id} className="hover:bg-fjord-850/60">
                <td className="px-4 py-3">
                  <Link to={`/incidents?nodeId=${node.id}`} className="font-semibold text-fjord-100 hover:underline">
                    {node.name}
                  </Link>
                  <p className="text-fjord-400">{node.location}</p>
                </td>
                <td className="px-4 py-3">
                  <NodeStatusBadge status={node.status} />
                </td>
                <UptimeCell value={node.uptime24h} target={data.slaTargetPercent} />
                <UptimeCell value={node.uptime7d} target={data.slaTargetPercent} />
                <UptimeCell value={node.uptime30d} target={data.slaTargetPercent} />
                <td className="px-4 py-3 text-right text-fjord-300">
                  {node.downtimeMinutes > 0 ? formatDuration(node.downtimeMinutes) : <span className="text-fjord-400">None</span>}
                </td>
                <td className="px-4 py-3 text-right text-fjord-300">{node.outages}</td>
                <td className="px-4 py-3">
                  {node.meetsSla ? (
                    <span className="text-sm font-semibold text-signal">Meets target</span>
                  ) : (
                    <span className="text-sm font-semibold text-outage">Below target</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-6 w-2/3 max-w-2xl" />
      <Skeleton className="h-24" />
      <Skeleton className="h-64" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export default AnalyticsPage;
