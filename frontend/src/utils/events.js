import { INCIDENT_STATUS } from "./labels";

const VERBS = {
  AUTO_DETECTED: "detected an outage",
  AUTO_RESOLVED: "confirmed recovery",
  CREATED: "raised the incident",
  NOTE: "added a note",
  DELETED: "deleted the incident",
  RESTORED: "restored the incident",
};

/** "moved it from Open to In progress", "added a note", ... */
export function describeEvent(event) {
  if (event.type === "STATUS_CHANGED") {
    const from = INCIDENT_STATUS[event.fromStatus]?.label ?? event.fromStatus;
    const to = INCIDENT_STATUS[event.toStatus]?.label ?? event.toStatus;
    return `moved it from ${from} to ${to}`;
  }
  return VERBS[event.type] ?? event.type.toLowerCase();
}

export const EVENT_DOT = {
  AUTO_DETECTED: "bg-outage",
  AUTO_RESOLVED: "bg-signal",
  CREATED: "bg-notice",
  STATUS_CHANGED: "bg-fjord-300",
  NOTE: "bg-calm",
  DELETED: "bg-fjord-600",
  RESTORED: "bg-fjord-300",
};
