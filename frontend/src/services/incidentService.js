import api from "./api";

export const getAllIncidents = async () => {
  const response = await api.get("/incidents");
  return response.data;
};

export const getDeletedIncidents = async () => {
  const response = await api.get("/incidents/deleted");
  return response.data;
};

export const createIncident = async (incidentData) => {
  const { nodeId, description, severity, status } = incidentData;

  const response = await api.post(`/incidents/node/${nodeId}`, {
    description,
    severity,
    status,
  });

  return response.data;
};

export const deleteIncident = async (id) => {
  const response = await api.delete(`/incidents/${id}`);
  return response.data;
};

export const restoreIncident = async (id) => {
  const response = await api.put(`/incidents/${id}/restore`);
  return response.data;
};

export const getIncidentById = async (id) => {
  const response = await api.get(`/incidents/${id}`);
  return response.data;
};

export const filterIncidentsByStatus = async (status) => {
  const response = await api.get("/incidents", {
    params: { status },
  });
  return response.data;
};

export const updateIncidentStatus = async (id, status) => {
  const response = await api.put(`/incidents/${id}/status`, {
    status,
  });
  return response.data;
};