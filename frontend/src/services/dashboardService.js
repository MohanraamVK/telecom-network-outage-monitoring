import { getAllNodes } from "./nodeService";
import { getAllIncidents } from "./incidentService";

export const getDashboardData = async () => {
  const nodesResponse = await getAllNodes();
  const incidentsResponse = await getAllIncidents();

  const nodes = Array.isArray(nodesResponse?.data) ? nodesResponse.data : [];
  const incidents = Array.isArray(incidentsResponse?.data)
    ? incidentsResponse.data
    : [];

  return {
    nodes,
    incidents,
  };
};