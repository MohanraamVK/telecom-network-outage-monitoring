import { useState } from "react";
import { useElementWidth } from "../../hooks/useElementWidth";
import { TONE } from "../../utils/labels";
import { labelIndexes, niceTicks, PAD, shortDate } from "./chartUtils";

/**
 * Grouped daily bars. series: [{ key, label, tone }], rows: [{ date, [key]: number | null }]
 * Counts get whole-number ticks; pass `format` (and integer={false} or `tickValues(max)`) for other values.
 * A null value shows `emptyText` in the tooltip.
 */
function BarChart({ rows, series, height = 220, label, format = (v) => v, integer = true, minTop = 1, emptyText = "0", tickValues }) {
  const [ref, width] = useElementWidth();
  const [hover, setHover] = useState(null);

  const max = Math.max(minTop, ...rows.flatMap((r) => series.map((s) => r[s.key] ?? 0)));
  const ticks = tickValues ? tickValues(max) : integer ? niceTicks(0, max, Math.min(4, max)).filter((t) => Number.isInteger(t)) : niceTicks(0, max, 4);
  const top = Math.max(max, ticks[ticks.length - 1] ?? max);
  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const slot = innerW / rows.length;
  const barW = Math.max(1.5, Math.min(14, (slot * 0.7) / series.length));
  const y = (v) => PAD.top + innerH - (v / top) * innerH;
  const labelled = labelIndexes(rows.length, Math.max(2, Math.floor(innerW / 72)));
  const hovered = hover != null ? rows[hover] : null;

  return (
    <div ref={ref} className="relative w-full min-w-0">
      <svg width={width} height={height} role="img" aria-label={label} onMouseLeave={() => setHover(null)} className="block">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="stroke-fjord-800" />
            <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fjord-400 text-[11px]">
              {format(t)}
            </text>
          </g>
        ))}
        {rows.map((row, i) => {
          const groupX = PAD.left + i * slot + (slot - barW * series.length) / 2;
          return (
            <g key={row.date} onMouseEnter={() => setHover(i)}>
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              {i === hover ? (
                <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} className="fill-fjord-800/50" />
              ) : null}
              {series.map((s, j) => {
                const v = row[s.key] ?? 0;
                return v > 0 ? (
                  <rect
                    key={s.key}
                    x={groupX + j * barW}
                    y={y(v)}
                    width={barW - 1}
                    height={PAD.top + innerH - y(v)}
                    rx="1.5"
                    className={TONE[s.tone].fill}
                  />
                ) : null;
              })}
              {labelled.has(i) ? (
                <text x={PAD.left + i * slot + slot / 2} y={height - 8} textAnchor="middle" className="fill-fjord-400 text-[11px]">
                  {shortDate(row.date)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      {hovered ? (
        <div
          className="pointer-events-none absolute top-0 rounded border border-fjord-700 bg-fjord-850 px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(PAD.left + hover * slot - 50, 0), width - 140) }}
        >
          <p className="text-fjord-400">{shortDate(hovered.date)}</p>
          {series.map((s) => (
            <p key={s.key} className="text-fjord-100">
              {s.label}: <span className="font-semibold">{hovered[s.key] == null ? emptyText : format(hovered[s.key])}</span>
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default BarChart;
