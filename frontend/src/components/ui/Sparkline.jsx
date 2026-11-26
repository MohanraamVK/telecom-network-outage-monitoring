/** Tiny latency chart. Draws the last samples as a line; the newest point is marked. */
function Sparkline({ values = [], width = 120, height = 28, tone = "text-signal", max }) {
  if (values.length < 2) {
    return <div style={{ width, height }} className="rounded bg-fjord-800/60" aria-hidden="true" />;
  }

  const top = Math.max(max ?? 0, ...values, 1);
  const stepX = width / (values.length - 1);
  const points = values.map((v, i) => [i * stepX, height - 2 - (v / top) * (height - 4)]);
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={tone} aria-hidden="true">
      <path d={area} fill="currentColor" opacity="0.12" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.25" fill="currentColor" />
    </svg>
  );
}

export default Sparkline;
