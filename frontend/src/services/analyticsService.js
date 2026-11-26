import api from "./api";

/** Uptime, SLA and incident trends for the last `days` days (7, 30 or 90). */
export const getAnalytics = async (days) => (await api.get("/analytics", { params: { days } })).data?.data;
