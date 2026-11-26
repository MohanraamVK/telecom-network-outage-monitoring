import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api",
  timeout: 15000,
});

function redirectToLoginWithMessage(message) {
  localStorage.removeItem("telecom_token");
  localStorage.removeItem("telecom_user");

  if (message) {
    sessionStorage.setItem("auth_message", message);
  }

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("telecom_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes("/auth/login");
    const backendMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Your session has expired. Please log in again.";

    if (status === 401 && !isLoginRequest) {
      redirectToLoginWithMessage(backendMessage);
    }

    return Promise.reject(error);
  }
);

export default api;