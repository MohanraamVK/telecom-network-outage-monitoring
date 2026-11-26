import { API_BASE_URL } from "./config";

/**
 * The single source of truth for the login session (access token, refresh token, user),
 * kept in localStorage so it survives reloads and is shared between tabs.
 *
 * Access tokens live 15 minutes. refreshSession() swaps the refresh token for a new pair.
 * Refresh tokens are single-use on the server (reuse revokes every session), so refreshes
 * are de-duplicated within a tab and serialised across tabs with the Web Locks API.
 */

const KEYS = { token: "telecom_token", refreshToken: "telecom_refresh", user: "telecom_user" };
const listeners = new Set();
let snapshot = read();
let inflight = null;

function read() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem(KEYS.user) || "null");
  } catch {
    user = null;
  }
  return {
    token: localStorage.getItem(KEYS.token),
    refreshToken: localStorage.getItem(KEYS.refreshToken),
    user,
  };
}

function emit() {
  snapshot = read();
  listeners.forEach((listener) => listener());
}

// Another tab logged in, refreshed or logged out
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (Object.values(KEYS).includes(event.key)) emit();
  });
}

export function getSession() {
  return snapshot;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Store the response of /auth/login, /auth/refresh or /auth/change-password. */
export function setSession({ token, refreshToken, username, role }) {
  localStorage.setItem(KEYS.token, token);
  if (refreshToken) localStorage.setItem(KEYS.refreshToken, refreshToken);
  localStorage.setItem(KEYS.user, JSON.stringify({ username, role }));
  emit();
}

export function clearSession(message) {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  if (message) sessionStorage.setItem("auth_message", message);
  emit();
}

/** Expiry of a JWT in ms since epoch, or null if it can't be read. */
export function tokenExpiry(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isExpired(token, skewMs = 0) {
  const expiry = token ? tokenExpiry(token) : null;
  return !expiry || Date.now() + skewMs >= expiry;
}

export class SessionExpiredError extends Error {
  constructor(message = "Your session has expired. Please log in again.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

async function exchange(staleRefreshToken) {
  const current = read();
  // Another tab rotated the tokens while we waited for the lock: use its result
  if (current.refreshToken && current.refreshToken !== staleRefreshToken && !isExpired(current.token, 5000)) {
    snapshot = current;
    return current.token;
  }
  if (!current.refreshToken) {
    throw new SessionExpiredError();
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  });
  if (!response.ok) {
    let message;
    try {
      message = (await response.json())?.message;
    } catch {
      message = undefined;
    }
    throw new SessionExpiredError(message);
  }
  const data = await response.json();
  setSession(data);
  return data.token;
}

/** Returns a fresh access token. Concurrent callers share one network request. */
export function refreshSession() {
  if (inflight) return inflight;
  const stale = read().refreshToken;
  const run = () => exchange(stale);
  const locked = typeof navigator !== "undefined" && navigator.locks?.request
    ? navigator.locks.request("telecom-token-refresh", run)
    : run();
  inflight = locked.finally(() => {
    inflight = null;
  });
  return inflight;
}
