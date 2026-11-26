import { useEffect, useRef, useState } from "react";

/** Width of an element, kept up to date with ResizeObserver (for responsive SVG charts). */
export function useElementWidth(initial = 600) {
  const ref = useRef(null);
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.floor(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
