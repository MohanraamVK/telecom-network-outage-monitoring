import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { searchIncidents } from "../../services/incidentService";
import { searchNodes } from "../../services/nodeService";
import { INCIDENT_STATUS, NODE_STATUS } from "../../utils/labels";
import { buildCommands, filterCommands, groupCommands } from "./commands";
import { KeySequence } from "./Kbd";

const SEARCH_DELAY_MS = 200;
const MIN_SEARCH_LENGTH = 2;
const NO_RESULTS = { query: "", nodes: [], incidents: [] };
const DEFAULT_SEARCH = { searchNodes, searchIncidents };

/** Server results for the typed text, as palette items. */
function liveItems(results) {
  const nodes = results.nodes.map((node) => ({
    id: `node-${node.id}`,
    group: "Nodes",
    label: node.name,
    hint: `${NODE_STATUS[node.status]?.label ?? node.status} in ${node.location}`,
    to: `/incidents?nodeId=${node.id}`,
  }));
  const incidents = results.incidents.map((incident) => ({
    id: `incident-${incident.id}`,
    group: "Incidents",
    label: `#${incident.id} ${incident.description}`,
    hint: `${INCIDENT_STATUS[incident.status]?.label ?? incident.status} on ${incident.nodeName}`,
    to: `/incidents?open=${incident.id}`,
  }));
  return [...nodes, ...incidents];
}

/**
 * Ctrl/Cmd+K palette: jump to a page, run an action, or find a node or incident.
 * Mounted only while open, so its state starts fresh every time.
 */
function CommandPalette({ canEdit, onClose, onRun, search = DEFAULT_SEARCH }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [results, setResults] = useState(NO_RESULTS);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const baseId = useId();

  const term = query.trim();

  useEffect(() => {
    const previous = document.activeElement;
    inputRef.current?.focus();
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (term.length < MIN_SEARCH_LENGTH) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [nodes, incidents] = await Promise.all([
          search.searchNodes({ q: term, size: 5, sort: "name,asc" }),
          search.searchIncidents({ q: term, size: 5, sort: "createdAt,desc" }),
        ]);
        if (!cancelled) setResults({ query: term, nodes: nodes?.content ?? [], incidents: incidents?.content ?? [] });
      } catch {
        if (!cancelled) setResults({ ...NO_RESULTS, query: term });
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, search]);

  const items = useMemo(() => {
    const commands = filterCommands(buildCommands({ canEdit }), term);
    const live = term.length >= MIN_SEARCH_LENGTH && results.query === term ? liveItems(results) : [];
    return [...commands, ...live];
  }, [canEdit, term, results]);

  const groups = groupCommands(items);
  const current = Math.min(active, Math.max(items.length - 1, 0));
  const optionId = (index) => `${baseId}-option-${index}`;

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: "nearest" });
  }, [current]);

  const run = (item) => {
    if (!item) return;
    onClose();
    onRun(item);
  };

  const onKeyDown = (event) => {
    const last = items.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive(current >= last ? 0 : current + 1);
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive(current <= 0 ? last : current - 1);
        break;
      case "Home":
        if (!query) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case "End":
        if (!query) {
          event.preventDefault();
          setActive(last);
        }
        break;
      case "Enter":
        event.preventDefault();
        run(items[current]);
        break;
      case "Escape":
        event.preventDefault();
        onClose();
        break;
      case "Tab":
        event.preventDefault();
        break;
      default:
    }
  };

  let index = -1;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-fjord-950/70 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-fjord-700 bg-fjord-900 shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-fjord-800 px-4">
          <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-fjord-400" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l3.5 3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${baseId}-list`}
            aria-activedescendant={items.length ? optionId(current) : undefined}
            aria-autocomplete="list"
            aria-label="Search pages, actions, nodes and incidents"
            placeholder="Jump to a page, run an action, or find a node or incident"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            className="h-13 min-w-0 flex-1 bg-transparent text-[15px] text-fjord-100 placeholder:text-fjord-400 focus:outline-none"
          />
          {searching ? <span className="text-xs text-fjord-400">Searching</span> : null}
        </div>

        <ul ref={listRef} id={`${baseId}-list`} role="listbox" aria-label="Results" className="overflow-y-auto p-2">
          {groups.map((group) => (
            <li key={group.group} role="presentation" className="pb-1">
              <p id={`${baseId}-${group.group}`} className="px-3 pt-2 pb-1 text-xs font-medium text-fjord-400">
                {group.group}
              </p>
              <ul role="group" aria-labelledby={`${baseId}-${group.group}`}>
                {group.items.map((item) => {
                  index += 1;
                  const position = index;
                  const selected = position === current;
                  return (
                    <li
                      key={item.id}
                      id={optionId(position)}
                      role="option"
                      aria-selected={selected}
                      onMouseMove={() => (selected ? null : setActive(position))}
                      onClick={() => run(item)}
                      className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm ${
                        selected ? "bg-fjord-800 text-fjord-100" : "text-fjord-300"
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.hint ? <span className="block truncate text-xs text-fjord-400">{item.hint}</span> : null}
                      </span>
                      {item.shortcut ? <KeySequence keys={item.shortcut} /> : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>

        {items.length === 0 ? (
          <p className="px-5 pt-2 pb-6 text-sm text-fjord-400">
            {searching || (term.length >= MIN_SEARCH_LENGTH && results.query !== term)
              ? "Searching nodes and incidents"
              : `Nothing matches “${term}”. Try a node name, a location or an incident number.`}
          </p>
        ) : null}

        <footer className="flex flex-wrap gap-x-4 gap-y-1 border-t border-fjord-800 px-4 py-2.5 text-xs text-fjord-400">
          <span className="inline-flex items-center gap-1.5">
            <KeySequence keys={["↑", "↓"]} /> to move
          </span>
          <span className="inline-flex items-center gap-1.5">
            <KeySequence keys={["Enter"]} /> to open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <KeySequence keys={["Esc"]} /> to close
          </span>
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default CommandPalette;
