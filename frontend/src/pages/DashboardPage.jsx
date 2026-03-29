import { useEffect, useState } from "react";
import NodeStatusBarChart from "../components/dashboard/NodeStatusBarChart";
import DashboardSkeleton from "../components/dashboard/DashBoardSkeleton";
import SeverityPieChart from "../components/dashboard/SeverityPieChart";
import StatsCard from "../components/dashboard/StatsCard";
import StatusBarChart from "../components/dashboard/StatusBarChart";
import { useToast } from "../context/ToastContext";
import { getDashboardData } from "../services/dashboardService";

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
  });

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const { showError } = useToast();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setPageError("");

        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setPageError("Failed to load dashboard data.");
        showError("Failed to load dashboard", "Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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
      </div>

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