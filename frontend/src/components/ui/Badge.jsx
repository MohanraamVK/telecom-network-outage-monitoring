import { INCIDENT_STATUS, NODE_STATUS, SEVERITY, TONE } from "../../utils/labels";

function Badge({ tone = "muted", children, dot = false, pulse = false }) {
  const t = TONE[tone] ?? TONE.muted;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${t.soft}`}>
      {dot ? (
        <span className={`size-1.5 rounded-full ${t.bg} ${pulse ? `animate-pulse-ring ${t.text}` : ""}`} />
      ) : null}
      {children}
    </span>
  );
}

export function NodeStatusBadge({ status }) {
  const meta = NODE_STATUS[status] ?? { label: status ?? "Unknown", tone: "muted" };
  return (
    <Badge tone={meta.tone} dot pulse={status === "DOWN"}>
      {meta.label}
    </Badge>
  );
}

export function IncidentStatusBadge({ status }) {
  const meta = INCIDENT_STATUS[status] ?? { label: status ?? "Unknown", tone: "muted" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function SeverityBadge({ severity }) {
  const meta = SEVERITY[severity] ?? { label: severity ?? "Unknown", tone: "muted" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export default Badge;
