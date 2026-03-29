import { getAllNodes } from "./nodeService";
import { getAllIncidents } from "./incidentService";

export const getDashboardData = async () => {
  const [nodesResponse, incidentsResponse] = await Promise.all([
    getAllNodes(),
    getAllIncidents(),
  ]);

  const nodes = Array.isArray(nodesResponse?.data) ? nodesResponse.data : [];
  const incidents = Array.isArray(incidentsResponse?.data)
    ? incidentsResponse.data
    : [];

  const activeNodes = nodes.filter((node) => !node.deleted);
  const activeIncidents = incidents.filter((incident) => !incident.deleted);

  return {
    totalNodes: activeNodes.length,
    totalIncidents: activeIncidents.length,

    activeNodeCount: activeNodes.filter((node) => node.status === "ACTIVE").length,
    downNodeCount: activeNodes.filter((node) => node.status === "DOWN").length,
    maintenanceNodeCount: activeNodes.filter((node) => node.status === "MAINTENANCE").length,

    openIncidents: activeIncidents.filter((incident) => incident.status === "OPEN").length,
    inProgressIncidents: activeIncidents.filter(
      (incident) => incident.status === "IN_PROGRESS"
    ).length,
    resolvedIncidents: activeIncidents.filter(
      (incident) => incident.status === "RESOLVED"
    ).length,
    closedIncidents: activeIncidents.filter(
      (incident) => incident.status === "CLOSED"
    ).length,

    lowSeverityIncidents: activeIncidents.filter(
      (incident) => incident.severity === "LOW"
    ).length,
    mediumSeverityIncidents: activeIncidents.filter(
      (incident) => incident.severity === "MEDIUM"
    ).length,
    highSeverityIncidents: activeIncidents.filter(
      (incident) => incident.severity === "HIGH"
    ).length,
    criticalSeverityIncidents: activeIncidents.filter(
      (incident) => incident.severity === "CRITICAL"
    ).length,
  };
};