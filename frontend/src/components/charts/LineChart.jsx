import { useState } from "react";
import { useElementWidth } from "../../hooks/useElementWidth";
import { labelIndexes, niceTicks, PAD, shortDate } from "./chartUtils";

/**
 * Daily line chart. Points with a null value leave a gap.
 * `target` draws a dashed reference line (e.g. the SLA target).
 */
function LineChart({ points, height = 220, domain, target, targetLabel, format = (v) => v, tickFormat = format, label, stroke = "text-signal" }) {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const values = points.map((p) => p.value).filter((v) => v != null);
  const [min, max] = domain ?? [Math.min(...values, target ?? Infinity), Math.max(...values, target ?? -Infinity)];
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - ((v - min) / (max - min || 1)) * innerH;

  // Split into segments at null values
  const segments = [];
  let current = [];
  points.forEach((p, i) => {
    if (p.value == null) {
      if (current.length) segments.push(current);
      current = [];
    } else {
      current.push([x(i), y(p.value)]);
    }
  });
  if (current.length) segments.push(current);

  const labelled = labelIndexes(points.length, Math.max(2, Math.floor(innerW / 72)));
  const ticks = niceTicks(min, max);

  const onMove = (event) => {
    const box = event.currentTarget.getBoundingClientRect();
    const relative = ((event.clientX - box.left) / box.width) * width;
    const index = Math.round(((relative - PAD.left) / innerW) * (points.length - 1));
    setHover(index >= 0 && index < points.length ? index : null);
  };

  const hovered = hover != null ? points[hover] : null;

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={label}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="block"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="stroke-fjord-800" />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fjord-400 text-[11px]">
              {tickFormat(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) =>
          labelled.has(i) ? (
            <text
              key={p.date}
              x={x(i)}
              y={height - 8}
              textAnchor={i === points.length - 1 && points.length > 1 ? "end" : "middle"}
              className="fill-fjord-400 text-[11px]"
            >
              {shortDate(p.date)}
            </text>
          ) : null
        )}
        {target != null ? (
          <g>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(target)} y2={y(target)} className="stroke-caution" strokeDasharray="4 4" />
            {targetLabel ? (
              <text x={width - PAD.right} y={y(target) - 6} textAnchor="end" className="fill-caution text-[11px]">
                {targetLabel}
              </text>
            ) : null}
          </g>
        ) : null}
        <g className={stroke}>
          {segments.map((segment, i) => (
            <path
              key={i}
              d={segment.map(([px, py], j) => `${j ? "L" : "M"}${px},${py}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ))}
          {points.map((p, i) =>
            p.value != null && (points.length <= 31 || i === hover) ? (
              <circle key={p.date} cx={x(i)} cy={y(p.value)} r={i === hover ? 4 : 2.5} fill="currentColor" />
            ) : null
          )}
        </g>
        {hover != null ? (
          <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} className="stroke-fjord-600" />
        ) : null}
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute top-0 rounded border border-fjord-700 bg-fjord-850 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(x(hover) - 60, 0), width - 130) }}
        >
          <p className="text-fjord-400">{shortDate(hovered.date)}</p>
          <p className="font-semibold text-fjord-100">{hovered.value == null ? "No data" : format(hovered.value)}</p>
        </div>
      ) : null}
    </div>
  );
}

export default LineChart;
