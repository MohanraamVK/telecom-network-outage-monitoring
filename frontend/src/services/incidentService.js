import api from "./api";
import { clean } from "./nodeService";

const unwrap = (response) => response.data?.data;

/** Server-side search: { q, status, severity, nodeId, deleted, page, size, sort } */
export const searchIncidents = async (params) =>
  unwrap(await api.get("/incidents/search", { params: clean(params) }));

export const getIncident = async (id) => unwrap(await api.get(`/incidents/${id}`));

export const getTimeline = async (id) => unwrap(await api.get(`/incidents/${id}/timeline`)) ?? [];

export const getRecentActivity = async (limit = 12) =>
  unwrap(await api.get("/incidents/activity", { params: { limit } })) ?? [];

export const createIncident = async ({ nodeId, description, severity, status }) =>
  unwrap(await api.post(`/incidents/node/${nodeId}`, { description, severity, status }));

export const updateIncidentStatus = async (id, status) =>
  unwrap(await api.put(`/incidents/${id}/status`, { status }));

export const addNote = async (id, message) => unwrap(await api.post(`/incidents/${id}/notes`, { message }));

export const deleteIncident = async (id) => (await api.delete(`/incidents/${id}`)).data;

export const restoreIncident = async (id) => (await api.put(`/incidents/${id}/restore`)).data;
