import api from "./api";

/**
 * Loads all dashboard metrics with a single request. The backend computes the
 * counts in the database instead of the browser downloading every node and
 * incident just to count them.
 */
export const getDashboardData = async () => {
  const response = await api.get("/dashboard/summary");
  const summary = response.data?.data ?? {};

  return {
    totalNodes: summary.totalNodes ?? 0,
    totalIncidents: summary.totalIncidents ?? 0,

    activeNodeCount: summary.activeNodes ?? 0,
    downNodeCount: summary.downNodes ?? 0,
    maintenanceNodeCount: summary.maintenanceNodes ?? 0,

    openIncidents: summary.openIncidents ?? 0,
    inProgressIncidents: summary.inProgressIncidents ?? 0,
    resolvedIncidents: summary.resolvedIncidents ?? 0,
    closedIncidents: summary.closedIncidents ?? 0,

    lowSeverityIncidents: summary.lowSeverityIncidents ?? 0,
    mediumSeverityIncidents: summary.mediumSeverityIncidents ?? 0,
    highSeverityIncidents: summary.highSeverityIncidents ?? 0,
    criticalSeverityIncidents: summary.criticalSeverityIncidents ?? 0,
    unresolvedCriticalIncidents: summary.unresolvedCriticalIncidents ?? 0,

    networkAvailabilityPercent: summary.networkAvailabilityPercent ?? 100,
    averageResolutionMinutes: summary.averageResolutionMinutes ?? null,
  };
};
