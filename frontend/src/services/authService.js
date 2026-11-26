import api from "./api";

export const loginUser = async (credentials) => (await api.post("/auth/login", credentials)).data;

/** Best effort: revokes the refresh token on the server. Never throws. */
export const logoutUser = async (refreshToken) => {
  if (!refreshToken) return;
  try {
    await api.post("/auth/logout", { refreshToken });
  } catch {
    // already logged out locally; nothing else to do
  }
};

export const changePassword = async (currentPassword, newPassword) =>
  (await api.post("/auth/change-password", { currentPassword, newPassword })).data;
