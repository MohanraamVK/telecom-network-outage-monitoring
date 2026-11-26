// Mirrors IncidentStatus.allowedNextStatuses() in the backend so the UI only
// offers status changes the API will accept.
export const INCIDENT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const ALLOWED_NEXT = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED"],
  RESOLVED: ["OPEN", "IN_PROGRESS", "CLOSED"],
  CLOSED: [],
};

export function canTransition(from, to) {
  if (!from || from === to) {
    return true;
  }
  return (ALLOWED_NEXT[from] || []).includes(to);
}

export function isFinalStatus(status) {
  return status === "CLOSED";
}
