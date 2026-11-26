import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeToken, jsonResponse } from "../test/jwt";

// tokenStore keeps module state, so each test gets a fresh copy
async function freshStore() {
  vi.resetModules();
  return import("./tokenStore");
}

const loginResponse = (overrides = {}) => ({
  token: fakeToken(900),
  refreshToken: "refresh-1",
  username: "admin",
  role: "ADMIN",
  ...overrides,
});

describe("tokenStore", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores, shares and clears the session", async () => {
    const store = await freshStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setSession(loginResponse());
    expect(store.getSession()).toMatchObject({ refreshToken: "refresh-1", user: { username: "admin", role: "ADMIN" } });
    expect(listener).toHaveBeenCalledTimes(1);

    store.clearSession("Signed out elsewhere");
    expect(store.getSession().token).toBeNull();
    expect(sessionStorage.getItem("auth_message")).toBe("Signed out elsewhere");
  });

  it("reads the expiry from the token", async () => {
    const store = await freshStore();
    expect(store.isExpired(fakeToken(900))).toBe(false);
    expect(store.isExpired(fakeToken(5), 10_000)).toBe(true);
    expect(store.isExpired("garbage")).toBe(true);
    expect(store.isExpired(null)).toBe(true);
  });

  it("swaps the refresh token for a new pair", async () => {
    const store = await freshStore();
    store.setSession(loginResponse({ token: fakeToken(-10) }));
    const next = loginResponse({ refreshToken: "refresh-2" });
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(next));
    vi.stubGlobal("fetch", fetchMock);

    await expect(store.refreshSession()).resolves.toBe(next.token);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ refreshToken: "refresh-1" });
    expect(store.getSession().refreshToken).toBe("refresh-2");
  });

  it("sends one request when several callers refresh at once", async () => {
    const store = await freshStore();
    store.setSession(loginResponse({ token: fakeToken(-10) }));
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(loginResponse({ refreshToken: "refresh-2" })));
    vi.stubGlobal("fetch", fetchMock);

    const [a, b, c] = await Promise.all([store.refreshSession(), store.refreshSession(), store.refreshSession()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new Set([a, b, c]).size).toBe(1);
  });

  it("uses tokens another tab already refreshed instead of reusing a spent refresh token", async () => {
    const store = await freshStore();
    store.setSession(loginResponse({ token: fakeToken(-10) }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    // Another tab rotates while this one waits for the lock
    const otherTabToken = fakeToken(900);
    vi.stubGlobal("navigator", {
      locks: {
        request: async (_name, callback) => {
          localStorage.setItem("telecom_token", otherTabToken);
          localStorage.setItem("telecom_refresh", "refresh-from-other-tab");
          return callback();
        },
      },
    });

    await expect(store.refreshSession()).resolves.toBe(otherTabToken);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports an expired session with the server's message", async () => {
    const store = await freshStore();
    store.setSession(loginResponse());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ message: "Refresh token was revoked" }, 401)));

    const error = await store.refreshSession().catch((e) => e);
    expect(error).toBeInstanceOf(store.SessionExpiredError);
    expect(error.message).toBe("Refresh token was revoked");
  });

  it("fails without a network call when there is no refresh token", async () => {
    const store = await freshStore();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(store.refreshSession()).rejects.toBeInstanceOf(store.SessionExpiredError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
