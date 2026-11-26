import { useCallback, useState } from "react";
import ActivityFeed from "../components/overview/ActivityFeed";
import Breakdown from "../components/overview/Breakdown";
import NodeGrid from "../components/overview/NodeGrid";
import { ErrorBanner, Skeleton } from "../components/ui/Feedback";
import { useLive, useLiveRefresh } from "../context/LiveContext";
import { useReload } from "../hooks/useReload";
import { getDashboardSummary } from "../services/dashboardService";
import { errorMessage } from "../services/errors";
import { getRecentActivity } from "../services/incidentService";
import { getNodeHealth } from "../services/monitoringService";
import { formatDuration } from "../utils/time";

function DashboardPage() {
  const { health: liveHealth } = useLive();
  const [summary, setSummary] = useState(null);
  const [initialHealth, setInitialHealth] = useState([]);
  const [activity, setActivity] = useState([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, h, a] = await Promise.all([getDashboardSummary(), getNodeHealth(), getRecentActivity(12)]);
      setSummary(s);
      setInitialHealth(h);
      setActivity(a);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "The overview could not be loaded."));
    }
  }, []);

  const refreshCounts = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([getDashboardSummary(), getRecentActivity(12)]);
      setSummary(s);
      setActivity(a);
    } catch {
      // keep showing the last good data; the live indicator shows connection trouble
    }
  }, []);

  useReload(load);

  useLiveRefresh(["node.changed", "incident.changed"], refreshCounts);

  // The live snapshot replaces the initial fetch as soon as the first one arrives
  const nodes = liveHealth ?? initialHealth;

  if (error && !summary) {
    return <ErrorBanner onRetry={load}>{error}</ErrorBanner>;
  }

  if (!summary) {
    return <OverviewSkeleton />;
  }

  const monitoredTotal = summary.totalNodes - summary.maintenanceNodes;
  const unresolved = summary.openIncidents + summary.inProgressIncidents;

  return (
    <div className="space-y-10">
      <header className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div>
          <Headline down={summary.downNodes} total={summary.totalNodes} monitored={monitoredTotal} />
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-fjord-300">
            {unresolved === 0
              ? "No incidents need attention."
              : `${unresolved} ${unresolved === 1 ? "incident needs" : "incidents need"} attention`}
            {summary.unresolvedCriticalIncidents > 0 ? (
              <>
                , including <span className="font-semibold text-outage">{summary.unresolvedCriticalIncidents} critical</span>
              </>
            ) : null}
            {unresolved > 0 ? "." : ""}
            {summary.maintenanceNodes > 0
              ? ` ${summary.maintenanceNodes} ${summary.maintenanceNodes === 1 ? "node is" : "nodes are"} in planned maintenance.`
              : ""}
          </p>
        </div>

        <dl className="grid grid-cols-2 divide-fjord-800 rounded-lg border border-fjord-800 sm:grid-cols-4 sm:divide-x">
          <Stat label="Availability" value={`${summary.networkAvailabilityPercent}%`} />
          <Stat label="Time to resolve" value={formatDuration(summary.averageResolutionMinutes)} hint="average" />
          <Stat label="Open" value={summary.openIncidents} />
          <Stat label="In progress" value={summary.inProgressIncidents} />
        </dl>
      </header>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-labelledby="nodes-heading" className="min-w-0">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="nodes-heading" className="font-display text-xl font-semibold">
              Nodes
            </h2>
            <p className="text-sm text-fjord-400">Latency over the last 5 minutes</p>
          </div>
          <NodeGrid nodes={nodes} />

          <div className="mt-10 grid gap-8 rounded-lg border border-fjord-800 p-5 md:grid-cols-2">
            <Breakdown
              title="Incidents by status"
              items={[
                { label: "Open", value: summary.openIncidents, tone: "outage" },
                { label: "In progress", value: summary.inProgressIncidents, tone: "notice" },
                { label: "Resolved", value: summary.resolvedIncidents, tone: "signal" },
                { label: "Closed", value: summary.closedIncidents, tone: "muted" },
              ]}
            />
            <Breakdown
              title="Incidents by severity"
              items={[
                { label: "Critical", value: summary.criticalSeverityIncidents, tone: "outage" },
                { label: "High", value: summary.highSeverityIncidents, tone: "caution" },
                { label: "Medium", value: summary.mediumSeverityIncidents, tone: "calm" },
                { label: "Low", value: summary.lowSeverityIncidents, tone: "muted" },
              ]}
            />
          </div>
        </section>

        <section aria-labelledby="activity-heading">
          <h2 id="activity-heading" className="mb-3 font-display text-xl font-semibold">
            Activity
          </h2>
          <ActivityFeed events={activity} />
        </section>
      </div>
    </div>
  );
}

function Headline({ down, total, monitored }) {
  if (total === 0) {
    return <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">No nodes yet</h1>;
  }
  if (down === 0) {
    return (
      <h1 className="font-display text-4xl font-semibold tracking-tight text-fjord-100 sm:text-5xl">
        All {monitored} active nodes are up
      </h1>
    );
  }
  return (
    <h1 className="font-display text-4xl font-semibold tracking-tight text-fjord-100 sm:text-5xl">
      <span className="text-outage">
        {down} of {total} nodes {down === 1 ? "is" : "are"} down
      </span>
    </h1>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="px-5 py-4">
      <dt className="text-sm text-fjord-400">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-semibold text-fjord-100">
        {value}
        {hint ? <span className="ml-1.5 text-sm font-normal text-fjord-400">{hint}</span> : null}
      </dd>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-12 w-2/3 max-w-xl" />
        <Skeleton className="h-5 w-1/2 max-w-md" />
      </div>
      <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-none" />
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
