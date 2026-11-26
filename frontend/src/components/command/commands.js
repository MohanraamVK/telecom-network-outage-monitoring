// Pure helpers for the command palette, kept separate so they are easy to test.

export const SHORTCUTS = [
  { keys: ["Ctrl", "K"], mac: ["⌘", "K"], label: "Open the command palette" },
  { keys: ["g", "o"], label: "Go to Overview" },
  { keys: ["g", "n"], label: "Go to Nodes" },
  { keys: ["g", "i"], label: "Go to Incidents" },
  { keys: ["g", "a"], label: "Go to Analytics" },
  { keys: ["c"], label: "Raise an incident", adminOnly: true },
  { keys: ["?"], label: "Show keyboard shortcuts" },
];

/** Static commands: pages first, then actions the user is allowed to take. */
export function buildCommands({ canEdit }) {
  const pages = [
    { id: "go-overview", group: "Go to", label: "Overview", keywords: "dashboard home", shortcut: ["g", "o"], to: "/" },
    { id: "go-nodes", group: "Go to", label: "Nodes", keywords: "towers sites network", shortcut: ["g", "n"], to: "/nodes" },
    { id: "go-incidents", group: "Go to", label: "Incidents", keywords: "outages tickets alarms", shortcut: ["g", "i"], to: "/incidents" },
    { id: "go-analytics", group: "Go to", label: "Analytics", keywords: "uptime sla availability mttr reports", shortcut: ["g", "a"], to: "/analytics" },
  ];

  const actions = [
    canEdit && { id: "new-incident", group: "Actions", label: "Raise an incident", keywords: "create new report outage", shortcut: ["c"], to: "/incidents?new=1" },
    canEdit && { id: "new-node", group: "Actions", label: "Add a node", keywords: "create new tower site", to: "/nodes?new=1" },
    canEdit && { id: "change-password", group: "Actions", label: "Change password", keywords: "account security", action: "change-password" },
    { id: "shortcuts", group: "Actions", label: "Show keyboard shortcuts", keywords: "help keys hotkeys", shortcut: ["?"], action: "shortcuts" },
    { id: "logout", group: "Actions", label: "Log out", keywords: "sign out exit", action: "logout" },
  ].filter(Boolean);

  return [...pages, ...actions];
}

/**
 * Commands whose label or keywords contain every word of the query, best matches first:
 * label starts with the query, then a label word starts with it, then anywhere else.
 * An empty query returns the list unchanged.
 */
export function filterCommands(commands, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return commands;

  const score = (command) => {
    const label = command.label.toLowerCase();
    const haystack = `${label} ${command.keywords ?? ""}`.toLowerCase();
    if (!words.every((word) => haystack.includes(word))) return -1;
    const first = words[0];
    if (label.startsWith(first)) return 3;
    if (label.split(/\s+/).some((part) => part.startsWith(first))) return 2;
    return 1;
  };

  return commands
    .map((command, index) => ({ command, index, score: score(command) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.command);
}

/** Keeps group order as first seen: [{ group, items }] */
export function groupCommands(commands) {
  const groups = [];
  for (const command of commands) {
    let group = groups.find((g) => g.group === command.group);
    if (!group) {
      group = { group: command.group, items: [] };
      groups.push(group);
    }
    group.items.push(command);
  }
  return groups;
}

const SEQUENCE_TIMEOUT_MS = 1200;
const GO_TO = { o: "/", n: "/nodes", i: "/incidents", a: "/analytics" };

/** True when a key press should go to a text field rather than to shortcuts. */
export function isTypingTarget(target) {
  if (!target || typeof target !== "object") return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || Boolean(target.isContentEditable);
}

/**
 * Turns one keydown into a shortcut result. `pending` carries a half-typed "g" sequence.
 * Returns { command, pending } where command is null, { palette: true }, { navigate }, or { action }.
 */
export function resolveShortcut(event, pending, { canEdit, now = Date.now() } = {}) {
  const key = event.key;

  if ((event.ctrlKey || event.metaKey) && !event.altKey && key.toLowerCase() === "k") {
    return { command: { palette: true }, pending: null };
  }
  if (event.ctrlKey || event.metaKey || event.altKey) return { command: null, pending: null };
  if (isTypingTarget(event.target)) return { command: null, pending: null };

  const fresh = pending && now - pending.at < SEQUENCE_TIMEOUT_MS ? pending : null;

  if (fresh?.key === "g") {
    const to = GO_TO[key.toLowerCase()];
    return { command: to ? { navigate: to } : null, pending: null };
  }
  if (key === "g") return { command: null, pending: { key: "g", at: now } };
  if (key === "?") return { command: { action: "shortcuts" }, pending: null };
  if (key === "c" && canEdit) return { command: { navigate: "/incidents?new=1" }, pending: null };
  return { command: null, pending: null };
}

export const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform ?? "");
