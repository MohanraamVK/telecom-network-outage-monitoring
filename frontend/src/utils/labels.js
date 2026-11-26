// Human-readable labels and colours for API enums.

export const NODE_STATUS = {
  ACTIVE: { label: "Up", tone: "signal" },
  DOWN: { label: "Down", tone: "outage" },
  MAINTENANCE: { label: "Maintenance", tone: "caution" },
};

export const INCIDENT_STATUS = {
  OPEN: { label: "Open", tone: "outage" },
  IN_PROGRESS: { label: "In progress", tone: "notice" },
  RESOLVED: { label: "Resolved", tone: "signal" },
  CLOSED: { label: "Closed", tone: "muted" },
};

export const SEVERITY = {
  CRITICAL: { label: "Critical", tone: "outage", rank: 4 },
  HIGH: { label: "High", tone: "caution", rank: 3 },
  MEDIUM: { label: "Medium", tone: "calm", rank: 2 },
  LOW: { label: "Low", tone: "muted", rank: 1 },
};

/** Tailwind classes per tone (full class names so Tailwind can find them). */
export const TONE = {
  signal: { fill: "fill-signal", text: "text-signal", bg: "bg-signal", soft: "bg-signal/12 text-signal ring-signal/25" },
  outage: { fill: "fill-outage", text: "text-outage", bg: "bg-outage", soft: "bg-outage/12 text-outage ring-outage/30" },
  caution: { fill: "fill-caution", text: "text-caution", bg: "bg-caution", soft: "bg-caution/12 text-caution ring-caution/25" },
  notice: { fill: "fill-notice", text: "text-notice", bg: "bg-notice", soft: "bg-notice/12 text-notice ring-notice/25" },
  calm: { fill: "fill-calm", text: "text-calm", bg: "bg-calm", soft: "bg-calm/12 text-calm ring-calm/25" },
  muted: { fill: "fill-fjord-400", text: "text-fjord-300", bg: "bg-fjord-400", soft: "bg-fjord-700/60 text-fjord-300 ring-fjord-600/60" },
};
