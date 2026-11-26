import { createContext, useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { changePassword as changePasswordRequest, loginUser, logoutUser } from "../services/authService";
import { clearSession, getSession, refreshSession, setSession, subscribe, tokenExpiry } from "../services/tokenStore";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

/** Refresh this long before the access token expires (keeps the live stream authorised too). */
const REFRESH_AHEAD_MS = 60_000;

export function AuthProvider({ children }) {
  const session = useSyncExternalStore(subscribe, getSession);
  const { token, refreshToken, user } = session;

  // Proactive refresh shortly before expiry; if it fails the session ends
  useEffect(() => {
    if (!refreshToken) return undefined;
    const expiry = token ? tokenExpiry(token) : null;
    const delay = expiry ? Math.max(5_000, expiry - Date.now() - REFRESH_AHEAD_MS) : 0;
    const timer = setTimeout(() => {
      refreshSession().catch((error) => {
        clearSession(error?.message || "Your session has expired. Please log in again.");
        if (window.location.pathname !== "/login") window.location.href = "/login";
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [token, refreshToken]);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    if (!data?.token) {
      throw new Error("The server did not return a token.");
    }
    setSession(data);
    sessionStorage.removeItem("auth_message");
    return data;
  }, []);

  const logout = useCallback(({ redirectToLogin = true, message = "" } = {}) => {
    logoutUser(getSession().refreshToken);
    clearSession(message);
    if (redirectToLogin && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const data = await changePasswordRequest(currentPassword, newPassword);
    setSession(data);
    return data;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      // An expired access token is fine: the refresh token renews it on the next request
      isAuthenticated: Boolean(token),
      // Only admins can change data; the public demo account (VIEWER) is read-only.
      canEdit: user?.role === "ADMIN",
      login,
      logout,
      changePassword,
    }),
    [token, user, login, logout, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
