import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE_URL } from "../services/api";

/**
 * Live updates over Server-Sent Events.
 *
 * Uses fetch() instead of EventSource so the JWT travels in the Authorization
 * header rather than in the URL (where it would end up in proxy logs).
 * Reconnects with exponential backoff.
 */
const LiveContext = createContext(null);

const MAX_BACKOFF_MS = 30000;

export function LiveProvider({ children }) {
  const { token } = useAuth();
  const [status, setStatus] = useState("offline"); // "connecting" | "live" | "offline"
  const [health, setHealth] = useState(null); // latest monitoring snapshot
  const listeners = useRef(new Map());

  const dispatch = useCallback((type, payload) => {
    for (const key of [type, "*"]) {
      listeners.current.get(key)?.forEach((callback) => callback(payload, type));
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus("offline");
      return undefined;
    }

    const controller = new AbortController();
    let attempt = 0;
    let retryTimer = null;

    const handleBlock = (block) => {
      let event = "message";
      const data = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
      }
      if (data.length === 0 || event === "connected") return;

      let payload;
      try {
        payload = JSON.parse(data.join("\n"));
      } catch {
        return;
      }
      if (event === "monitoring.snapshot") {
        setHealth(payload?.data?.nodes ?? []);
      }
      dispatch(event, payload);
    };

    const connect = async () => {
      setStatus("connecting");
      try {
        const response = await fetch(`${API_BASE_URL}/events/stream`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.status === 401 || response.status === 403) {
          setStatus("offline");
          return; // the regular API calls handle logging out
        }
        if (!response.ok || !response.body) {
          throw new Error(`Stream failed with ${response.status}`);
        }

        setStatus("live");
        attempt = 0;

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value.replace(/\r\n/g, "\n");
          let boundary;
          while ((boundary = buffer.indexOf("\n\n")) >= 0) {
            handleBlock(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
          }
        }
        throw new Error("Stream closed");
      } catch {
        if (controller.signal.aborted) return;
        setStatus("offline");
        attempt += 1;
        retryTimer = setTimeout(connect, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt));
      }
    };

    connect();

    return () => {
      controller.abort();
      clearTimeout(retryTimer);
    };
  }, [token, dispatch]);

  const subscribe = useCallback((type, callback) => {
    if (!listeners.current.has(type)) listeners.current.set(type, new Set());
    listeners.current.get(type).add(callback);
    return () => listeners.current.get(type)?.delete(callback);
  }, []);

  const value = useMemo(() => ({ status, health, subscribe }), [status, health, subscribe]);

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLive() {
  const context = useContext(LiveContext);
  if (!context) throw new Error("useLive must be used inside LiveProvider");
  return context;
}

/**
 * Calls `onEvent` (debounced) whenever one of the given live event types arrives.
 * Bursts, such as a node going down and its incident opening, collapse into one refresh.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useLiveRefresh(types, onEvent, delayMs = 400) {
  const { subscribe } = useLive();
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  const key = types.join("|");
  useEffect(() => {
    let timer = null;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current(), delayMs);
    };
    const unsubscribers = key.split("|").map((type) => subscribe(type, handler));
    return () => {
      clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [key, subscribe, delayMs]);
}
