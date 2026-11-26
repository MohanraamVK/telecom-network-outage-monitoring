import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loginUser } from "../services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];

    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    const jsonPayload = decodeURIComponent(
      decoded
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to parse JWT:", error);
    return null;
  }
}

function getTokenExpiryTime(token) {
  const decoded = parseJwt(token);

  if (!decoded?.exp) {
    return null;
  }

  return decoded.exp * 1000;
}

function isTokenExpired(token) {
  const expiryTime = getTokenExpiryTime(token);

  if (!expiryTime) {
    return true;
  }

  return Date.now() >= expiryTime;
}

function getInitialToken() {
  const storedToken = localStorage.getItem("telecom_token");

  if (!storedToken) {
    return null;
  }

  if (isTokenExpired(storedToken)) {
    localStorage.removeItem("telecom_token");
    localStorage.removeItem("telecom_user");
    sessionStorage.setItem(
      "auth_message",
      "Your session has expired. Please log in again."
    );
    return null;
  }

  return storedToken;
}

function getInitialUser() {
  const storedToken = localStorage.getItem("telecom_token");
  const storedUser = localStorage.getItem("telecom_user");

  if (!storedToken || !storedUser) {
    return null;
  }

  if (isTokenExpired(storedToken)) {
    localStorage.removeItem("telecom_token");
    localStorage.removeItem("telecom_user");
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    localStorage.removeItem("telecom_user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getInitialToken);
  const [user, setUser] = useState(getInitialUser);
  const logoutTimerRef = useRef(null);

  const clearLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(({
    redirectToLogin = true,
    message = "",
  } = {}) => {
    clearLogoutTimer();

    setToken(null);
    setUser(null);

    localStorage.removeItem("telecom_token");
    localStorage.removeItem("telecom_user");

    if (message) {
      sessionStorage.setItem("auth_message", message);
    }

    if (redirectToLogin && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }, [clearLogoutTimer]);

  useEffect(() => {
    clearLogoutTimer();

    if (!token) {
      localStorage.removeItem("telecom_token");
      return;
    }

    const expiryTime = getTokenExpiryTime(token);

    if (!expiryTime) {
      localStorage.removeItem("telecom_token");
      localStorage.removeItem("telecom_user");
      sessionStorage.setItem(
        "auth_message",
        "Your session is invalid. Please log in again."
      );

      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 0);

      return;
    }

    const timeRemaining = expiryTime - Date.now();

    if (timeRemaining <= 0) {
      localStorage.removeItem("telecom_token");
      localStorage.removeItem("telecom_user");
      sessionStorage.setItem(
        "auth_message",
        "Your session has expired. Please log in again."
      );

      setTimeout(() => {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }, 0);

      return;
    }

    localStorage.setItem("telecom_token", token);

    logoutTimerRef.current = setTimeout(() => {
      logout({
        redirectToLogin: true,
        message: "Your session has expired. Please log in again.",
      });
    }, timeRemaining);

    return () => {
      clearLogoutTimer();
    };
  }, [token, logout, clearLogoutTimer]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("telecom_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("telecom_user");
    }
  }, [user]);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);

    if (!data?.token || isTokenExpired(data.token)) {
      throw new Error("Received an invalid or expired token.");
    }

    setToken(data.token);
    setUser({
      username: data.username,
      role: data.role,
    });

    sessionStorage.removeItem("auth_message");

    return data;
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token),
      // Only admins can change data; the public demo account (VIEWER) is read-only.
      canEdit: user?.role === "ADMIN",
      login,
      logout,
    }),
    [token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}