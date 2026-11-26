import { useEffect } from "react";

/**
 * Runs `load` on mount and whenever it changes (i.e. when its inputs change).
 * `load` must be memoised with useCallback. Results that arrive after unmount are ignored by React.
 */
export function useReload(load) {
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);
}
