import { useCallback, useEffect, useState } from "react";
import NodeStatusBarChart from "../components/dashboard/NodeStatusBarChart";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import SeverityPieChart from "../components/dashboard/SeverityPieChart";
import StatsCard from "../components/dashboard/StatsCard";
import StatusBarChart from "../components/dashboard/StatusBarChart";
import { useToast } from "../context/ToastContext";
import { getDashboardData } from "../services/dashboardService";
import { formatDuration } from "../utils/time";

// Refresh the summary periodically so the dashboard works as a live wall screen.
const REFRESH_INTERVAL_MS = 30000;

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    totalNodes: 0,
    totalIncidents: 0,
    activeNodeCount: 0,
    downNodeCount: 0,
    maintenanceNodeCount: 0,
    openIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidents: 0,
    closedIncidents: 0,
    lowSeverityIncidents: 0,
    mediumSeverityIncidents: 0,
    highSeverityIncidents: 0,
    criticalSeverityIncidents: 0,
    unresolvedCriticalIncidents: 0,
    networkAvailabilityPercent: 100,
    averageResolutionMinutes: null,
  });
  const [lastUpdated, setLastUpdated] = useState(null);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const { showError } = useToast();

  const fetchDashboard = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setLoading(true);
        }
        setPageError("");

        const data = await getDashboardData();
        setDashboardData(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        // A failed background refresh keeps showing the last good data.
        if (!silent) {
          setPageError("Failed to load dashboard data.");
          showError("Failed to load dashboard", "Please try again.");
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [showError]
  );

  useEffect(() => {
    fetchDashboard();

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchDashboard({ silent: true });
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (pageError) {
    return <p style={styles.error}>{pageError}</p>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            Overview of nodes and incidents in the telecom monitoring system.
          </p>
        </div>
        <div style={styles.refreshBox}>
          {lastUpdated ? (
            <span style={styles.lastUpdated}>
              Updated {lastUpdated.toLocaleTimeString()} · auto-refresh 30s
            </span>
          ) : null}
          <button type="button" onClick={() => fetchDashboard()} style={styles.refreshButton}>
            Refresh
          </button>
        </div>
      </div>

      {dashboardData.unresolvedCriticalIncidents > 0 ? (
        <div style={styles.alert} role="alert">
          <strong>
            {dashboardData.unresolvedCriticalIncidents} critical incident
            {dashboardData.unresolvedCriticalIncidents === 1 ? "" : "s"} still unresolved.
          </strong>{" "}
          Check the Incidents page.
        </div>
      ) : null}

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Overall Summary</h2>
        <div style={styles.grid}>
          <StatsCard title="Total Active Nodes" value={dashboardData.totalNodes} />
          <StatsCard title="Total Active Incidents" value={dashboardData.totalIncidents} />
          <StatsCard title="Open Incidents" value={dashboardData.openIncidents} />
          <StatsCard title="Critical Incidents" value={dashboardData.criticalSeverityIncidents} />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Service Health</h2>
        <div style={styles.grid}>
          <StatsCard
            title="Network Availability"
            value={`${dashboardData.networkAvailabilityPercent}%`}
            subtitle="Share of nodes currently ACTIVE"
          />
          <StatsCard
            title="Mean Time to Resolve"
            value={formatDuration(dashboardData.averageResolutionMinutes)}
            subtitle={
              dashboardData.averageResolutionMinutes === null
                ? "No resolved incidents yet"
                : "Average from opened to resolved"
            }
          />
          <StatsCard
            title="Unresolved Critical"
            value={dashboardData.unresolvedCriticalIncidents}
            subtitle="CRITICAL incidents OPEN or IN_PROGRESS"
          />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Node Status Summary</h2>
        <div style={styles.grid}>
          <StatsCard title="Active Nodes" value={dashboardData.activeNodeCount} />
          <StatsCard title="Down Nodes" value={dashboardData.downNodeCount} />
          <StatsCard title="Maintenance Nodes" value={dashboardData.maintenanceNodeCount} />
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Incident Status Summary</h2>
        <div style={styles.grid}>
          <StatsCard title="Open" value={dashboardData.openIncidents} />
          <StatsCard title="In Progress" value={dashboardData.inProgressIncidents} />
          <StatsCard title="Resolved" value={dashboardData.resolvedIncidents} />
          <StatsCard title="Closed" value={dashboardData.closedIncidents} />
        </div>
      </section>

      <section style={styles.chartSection}>
        <h2 style={styles.sectionTitle}>Charts</h2>
        <div style={styles.chartGrid}>
          <NodeStatusBarChart
            active={dashboardData.activeNodeCount}
            down={dashboardData.downNodeCount}
            maintenance={dashboardData.maintenanceNodeCount}
          />

          <StatusBarChart
            open={dashboardData.openIncidents}
            inProgress={dashboardData.inProgressIncidents}
            resolved={dashboardData.resolvedIncidents}
            closed={dashboardData.closedIncidents}
          />

          <SeverityPieChart
            low={dashboardData.lowSeverityIncidents}
            medium={dashboardData.mediumSeverityIncidents}
            high={dashboardData.highSeverityIncidents}
            critical={dashboardData.criticalSeverityIncidents}
          />
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  refreshBox: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  lastUpdated: {
    fontSize: "13px",
    color: "#6B7280",
  },
  refreshButton: {
    border: "1px solid #D1D5DB",
    backgroundColor: "#FFFFFF",
    color: "#111827",
    padding: "8px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  alert: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FECACA",
    color: "#991B1B",
    padding: "12px 16px",
    borderRadius: "10px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    color: "#111827",
  },
  subtitle: {
    marginTop: "8px",
    color: "#6B7280",
    fontSize: "15px",
  },
  section: {
    marginBottom: "28px",
  },
  chartSection: {
    marginBottom: "28px",
  },
  sectionTitle: {
    marginBottom: "16px",
    fontSize: "20px",
    color: "#111827",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  error: {
    color: "#DC2626",
    fontSize: "16px",
  },
};

export default DashboardPage;