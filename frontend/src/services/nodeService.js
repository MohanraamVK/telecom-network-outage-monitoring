import api from "./api";

export const getAllNodes = async () => {
  const response = await api.get("/nodes");
  return response.data;
};

export const getDeletedNodes = async () => {
  const response = await api.get("/nodes/deleted");
  return response.data;
};

export const createNode = async (nodeData) => {
  const response = await api.post("/nodes", nodeData);
  return response.data;
};

export const updateNode = async (id, nodeData) => {
  const response = await api.put(`/nodes/${id}`, nodeData);
  return response.data;
};

export const deleteNode = async (id) => {
  const response = await api.delete(`/nodes/${id}`);
  return response.data;
};

export const restoreNode = async (id) => {
  const response = await api.put(`/nodes/${id}/restore`);
  return response.data;
};

export const getNodeById = async (id) => {
  const response = await api.get(`/nodes/${id}`);
  return response.data;
};