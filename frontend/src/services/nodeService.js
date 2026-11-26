import api from "./api";

const unwrap = (response) => response.data?.data;

/** Server-side search: { q, status, deleted, page, size, sort } -> { content, page, size, totalElements, totalPages } */
export const searchNodes = async (params) =>
  unwrap(await api.get("/nodes/search", { params: clean(params) }));

/** All active nodes (id, name, location, status) for dropdowns. */
export const getNodeOptions = async () => unwrap(await api.get("/nodes/options")) ?? [];

export const createNode = async (node) => unwrap(await api.post("/nodes", node));

export const updateNode = async (id, node) => unwrap(await api.put(`/nodes/${id}`, node));

export const deleteNode = async (id) => (await api.delete(`/nodes/${id}`)).data;

export const restoreNode = async (id) => (await api.put(`/nodes/${id}/restore`)).data;

function clean(params) {
  return Object.fromEntries(
    Object.entries(params ?? {}).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

export { clean };
