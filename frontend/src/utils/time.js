// Small date helpers for incident timestamps (ISO strings from the API).

function toDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "5m", "3h 20m", "2d 4h" */
export function formatDuration(totalMinutes) {
  if (totalMinutes === null || totalMinutes === undefined || Number.isNaN(totalMinutes)) {
    return "-";
  }

  const minutes = Math.max(0, Math.round(totalMinutes));

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }

  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days}d ${restHours}h` : `${days}d`;
}

/** "just now", "12m ago", "3h ago", "2d ago" */
export function formatRelative(value, now = new Date()) {
  const date = toDate(value);
  if (!date) {
    return "-";
  }

  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) {
    return "just now";
  }
  return `${formatDuration(minutes)} ago`;
}

export function formatDateTime(value) {
  const date = toDate(value);
  return date ? date.toLocaleString() : "";
}

/** Minutes between two ISO timestamps, or null if either is missing. */
export function minutesBetween(start, end) {
  const startDate = toDate(start);
  const endDate = toDate(end);
  if (!startDate || !endDate) {
    return null;
  }
  return (endDate.getTime() - startDate.getTime()) / 60000;
}
