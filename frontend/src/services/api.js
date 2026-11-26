import axios from "axios";
import { API_BASE_URL } from "./config";
import { clearSession, getSession, isExpired, refreshSession, SessionExpiredError } from "./tokenStore";

export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const AUTH_ENDPOINTS = ["/auth/login", "/auth/refresh", "/auth/logout"];
const isAuthEndpoint = (url = "") => AUTH_ENDPOINTS.some((path) => url.includes(path));

function endSession(message) {
  clearSession(message || "Your session has expired. Please log in again.");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use(async (config) => {
  if (isAuthEndpoint(config.url)) return config;

  let { token, refreshToken } = getSession();
  // Refresh up front if the access token is about to expire, to avoid a wasted 401
  if (refreshToken && isExpired(token, 10000)) {
    try {
      token = await refreshSession();
    } catch {
      // fall through: the 401 handler below ends the session
    }
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    if (response?.status !== 401 || !config || isAuthEndpoint(config.url)) {
      return Promise.reject(error);
    }

    // One silent retry with a refreshed token
    if (!config._retried && getSession().refreshToken) {
      config._retried = true;
      try {
        const token = await refreshSession();
        config.headers.Authorization = `Bearer ${token}`;
        return api(config);
      } catch (refreshError) {
        endSession(refreshError instanceof SessionExpiredError ? refreshError.message : undefined);
        return Promise.reject(error);
      }
    }

    endSession(response.data?.message);
    return Promise.reject(error);
  }
);

export default api;
