import { AxiosError } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeToken, jsonResponse } from "../test/jwt";

async function setup({ token = fakeToken(900), refreshToken = "refresh-1" } = {}) {
  vi.resetModules();
  localStorage.setItem("telecom_token", token);
  localStorage.setItem("telecom_refresh", refreshToken);
  localStorage.setItem("telecom_user", JSON.stringify({ username: "admin", role: "ADMIN" }));
  const store = await import("./tokenStore");
  const { default: api } = await import("./api");
  return { api, store };
}

/** Axios adapter that answers with the given statuses in order and records the auth headers. */
function adapter(statuses) {
  const seen = [];
  const fn = vi.fn(async (config) => {
    seen.push(config.headers.Authorization);
    const status = statuses.shift() ?? 200;
    const response = { status, data: { data: "ok", message: status === 401 ? "Unauthorized" : "" }, headers: {}, config, statusText: "" };
    if (status >= 400) throw new AxiosError("failed", "ERR_BAD_REQUEST", config, null, response);
    return response;
  });
  return { fn, seen };
}

describe("api client", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    window.history.pushState({}, "", "/login");
  });

  it("sends the access token", async () => {
    const { api } = await setup();
    const { fn, seen } = adapter([200]);
    api.defaults.adapter = fn;
    await api.get("/nodes");
    expect(seen[0]).toMatch(/^Bearer /);
  });

  it("refreshes and retries once after a 401", async () => {
    const { api, store } = await setup();
    const fresh = fakeToken(900);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ token: fresh, refreshToken: "refresh-2", username: "admin", role: "ADMIN" })));
    const { fn, seen } = adapter([401, 200]);
    api.defaults.adapter = fn;

    const response = await api.get("/nodes");
    expect(response.status).toBe(200);
    expect(seen).toEqual([expect.any(String), `Bearer ${fresh}`]);
    expect(store.getSession().refreshToken).toBe("refresh-2");
  });

  it("refreshes before sending when the token is about to expire", async () => {
    const { api } = await setup({ token: fakeToken(3) });
    const fresh = fakeToken(900);
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ token: fresh, refreshToken: "refresh-2", username: "admin", role: "ADMIN" }));
    vi.stubGlobal("fetch", fetchMock);
    const { fn, seen } = adapter([200]);
    api.defaults.adapter = fn;

    await api.get("/nodes");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(seen[0]).toBe(`Bearer ${fresh}`);
  });

  it("ends the session when the refresh fails", async () => {
    const { api, store } = await setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Session revoked" }, 401)));
    const { fn } = adapter([401]);
    api.defaults.adapter = fn;

    await expect(api.get("/nodes")).rejects.toBeInstanceOf(AxiosError);
    expect(store.getSession().token).toBeNull();
    expect(sessionStorage.getItem("auth_message")).toBe("Session revoked");
  });

  it("passes login errors straight through", async () => {
    const { api, store } = await setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { fn } = adapter([401]);
    api.defaults.adapter = fn;

    await expect(api.post("/auth/login", {})).rejects.toBeInstanceOf(AxiosError);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.getSession().token).not.toBeNull();
  });
});
