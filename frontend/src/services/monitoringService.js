import api from "./api";

/** Live health of every node: status, last heartbeat, latency history. */
export const getNodeHealth = async () => (await api.get("/monitoring/nodes")).data?.data ?? [];
