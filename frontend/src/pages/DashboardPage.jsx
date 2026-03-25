import { useEffect, useState } from "react";
import StatsCard from "../components/dashboard/StatsCard";
import { getDashboardData } from "../services/dashboardService";

function DashboardPage() {
  const [stats, setStats] = useState({
    totalNodes: 0,
    totalIncidents: 0,
    openIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidents: 0,
    closedIncidents: 0,
    criticalIncidents: 0,
  });

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setPageError("");

        const { nodes, incidents } = await getDashboardData();

        setStats({
          totalNodes: nodes.length,
          totalIncidents: incidents.length,
          openIncidents: incidents.filter((i) => i.status === "OPEN").length,
          inProgressIncidents: incidents.filter((i) => i.status === "IN_PROGRESS").length,
          resolvedIncidents: incidents.filter((i) => i.status === "RESOLVED").length,
          closedIncidents: incidents.filter((i) => i.status === "CLOSED").length,
          criticalIncidents: incidents.filter((i) => i.severity === "CRITICAL").length,
        });
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setPageError("Failed to load dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <p style={styles.message}>Loading dashboard...</p>;
  }

  if (pageError) {
    return <p style={styles.error}>{pageError}</p>;
  }

  return (
    <div style={styles.page}>
      <h2>Dashboard</h2>

      <div style={styles.grid}>
        <StatsCard title="Total Nodes" value={stats.totalNodes} />
        <StatsCard title="Total Incidents" value={stats.totalIncidents} />
        <StatsCard title="Open Incidents" value={stats.openIncidents} />
        <StatsCard title="In Progress Incidents" value={stats.inProgressIncidents} />
        <StatsCard title="Resolved Incidents" value={stats.resolvedIncidents} />
        <StatsCard title="Closed Incidents" value={stats.closedIncidents} />
        <StatsCard title="Critical Incidents" value={stats.criticalIncidents} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "30px auto",
    padding: "20px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  message: {
    padding: "20px",
  },
  error: {
    color: "red",
    padding: "20px",
  },
};

export default DashboardPage;