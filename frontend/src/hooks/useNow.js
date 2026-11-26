import { useEffect, useState } from "react";

/** Current time, re-rendering every `intervalMs` so "12s ago" labels stay fresh. */
export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
