export const PAD = { top: 12, right: 12, bottom: 28, left: 48 };

/** "Nov 26" */
export function shortDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Show about `target` evenly spaced labels along the x axis. */
export function tickEvery(count, target = 7) {
  return Math.max(1, Math.ceil(count / target));
}

/**
 * Indexes that get an x-axis date label: every nth point plus the last one,
 * dropping a regular label that would sit too close to the last.
 */
export function labelIndexes(count, target = 7) {
  if (count <= 0) return new Set();
  const every = tickEvery(count, target);
  const indexes = new Set();
  for (let i = 0; i < count; i += every) indexes.add(i);
  const last = count - 1;
  if (!indexes.has(last)) {
    const previous = Math.floor(last / every) * every;
    if (last - previous < Math.ceil(every / 2)) indexes.delete(previous);
    indexes.add(last);
  }
  return indexes;
}

/** Nice round y-axis ticks between min and max. */
export function niceTicks(min, max, count = 4) {
  if (max === min) return [min];
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw;
  const ticks = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step / 1000; v += step) {
    ticks.push(Number(v.toFixed(6)));
  }
  return ticks;
}

const MINUTE_STEPS = [5, 10, 15, 30, 60, 120, 180, 240, 360, 720, 1440, 2880];

/** Ticks for a duration axis in minutes, on steps people read easily (15m, 30m, 1h, 2h...). */
export function durationTicks(maxMinutes, count = 4) {
  const step = MINUTE_STEPS.find((s) => s * count >= maxMinutes) ?? Math.ceil(maxMinutes / count / 1440) * 1440;
  const ticks = [];
  for (let v = 0; v <= maxMinutes + step / 1000; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < maxMinutes) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}
