import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import IncidentDrawer from "../components/incident/IncidentDrawer";
import IncidentFormModal from "../components/incident/IncidentFormModal";
import { IncidentStatusBadge, SeverityBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { EmptyState, ErrorBanner, Skeleton } from "../components/ui/Feedback";
import { Pagination, SearchInput, Segmented, SortHeader } from "../components/ui/Toolbar";
import { useConfirmation } from "../context/ConfirmationContext";
import { useLiveRefresh } from "../context/LiveContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useReload } from "../hooks/useReload";
import { useNow } from "../hooks/useNow";
import { errorMessage } from "../services/errors";
import { createIncident, deleteIncident, restoreIncident, searchIncidents } from "../services/incidentService";
import { getNodeOptions } from "../services/nodeService";
import { formatDuration, formatRelative, minutesBetween } from "../utils/time";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

function IncidentsPage() {
  const { canEdit } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmation();
  const now = useNow(15000);
  const [params, setParams] = useSearchParams();

  const nodeId = params.get("nodeId") ? Number(params.get("nodeId")) : null;
  const openId = params.get("open") ? Number(params.get("open")) : null;

  const [query, setQuery] = useState({ q: "", status: "", severity: "", deleted: false, page: 0, size: 10, sort: "createdAt,desc" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  // "/incidents?new=1" (from the command palette or the c shortcut) opens the raise-incident form
  const createOpen = creating || (canEdit && params.get("new") === "1");
  const [nodeName, setNodeName] = useState("");

  const load = useCallback(async () => {
    try {
      setResult(await searchIncidents({ ...query, nodeId }));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Incidents could not be loaded."));
    }
  }, [query, nodeId]);

  useReload(load);

  useLiveRefresh(["incident.changed", "node.changed"], load);

  useEffect(() => {
    if (!nodeId) return;
    getNodeOptions()
      .then((nodes) => setNodeName(nodes.find((n) => n.id === nodeId)?.name ?? `Node #${nodeId}`))
      .catch(() => setNodeName(`Node #${nodeId}`));
  }, [nodeId]);

  const update = (patch) => setQuery((prev) => ({ ...prev, page: 0, ...patch }));
  const onSearch = useCallback((q) => setQuery((prev) => ({ ...prev, q, page: 0 })), []);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value == null) next.delete(key);
    else next.set(key, String(value));
    setParams(next, { replace: key === "open" || key === "new" });
  };

  const closeCreate = () => {
    setCreating(false);
    if (params.has("new")) setParam("new", null);
  };

  const save = async (values) => {
    const created = await createIncident(values);
    closeCreate();
    showSuccess("Incident raised", `#${created.id} on ${created.nodeName}`);
    load();
  };

  const remove = async (incident) => {
    const ok = await confirm({
      title: `Delete incident #${incident.id}?`,
      message: "It moves to Deleted and stops counting towards the dashboard. You can restore it later.",
      confirmText: "Delete incident",
    });
    if (!ok) return;
    try {
      await deleteIncident(incident.id);
      showSuccess("Incident deleted", `#${incident.id}`);
      setParam("open", null);
      load();
    } catch (err) {
      showError("Incident not deleted", errorMessage(err));
    }
  };

  const restore = async (incident) => {
    try {
      await restoreIncident(incident.id);
      showSuccess("Incident restored", `#${incident.id}`);
      load();
    } catch (err) {
      showError("Incident not restored", errorMessage(err));
    }
  };

  const filtered = query.q || query.status || query.severity || nodeId;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Incidents</h1>
          <p className="mt-1 text-fjord-400">Outages and faults, from detection to resolution.</p>
        </div>
        {canEdit && !query.deleted ? (
          <Button variant="primary" onClick={() => setCreating(true)}>
            Raise incident
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={query.q} onChange={onSearch} placeholder="Search description, node or #id" />
        <Segmented label="Status" value={query.status} onChange={(status) => update({ status })} options={STATUS_FILTERS} />
        <select
          value={query.severity}
          onChange={(event) => update({ severity: event.target.value })}
          aria-label="Severity"
          className="h-10 rounded-md bg-fjord-900 px-3 text-sm text-fjord-100 ring-1 ring-fjord-700 ring-inset"
        >
          <option value="">Any severity</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <Segmented
          label="Show"
          value={query.deleted ? "deleted" : "active"}
          onChange={(v) => update({ deleted: v === "deleted" })}
          options={[
            { value: "active", label: "Active" },
            { value: "deleted", label: "Deleted" },
          ]}
        />
        {nodeId ? (
          <button
            type="button"
            onClick={() => setParam("nodeId", null)}
            className="inline-flex h-8 items-center gap-2 rounded-full bg-notice/15 pr-2 pl-3 text-sm font-medium text-notice hover:bg-notice/25"
          >
            {nodeName || "Node"}
            <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Remove node filter</span>
          </button>
        ) : null}
      </div>

      {error ? <ErrorBanner onRetry={load}>{error}</ErrorBanner> : null}

      <div className="overflow-hidden rounded-lg border border-fjord-800 bg-fjord-900">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-fjord-800 text-fjord-400">
              <tr>
                <SortHeader field="id" sort={query.sort} onSort={(sort) => update({ sort })} className="w-20">#</SortHeader>
                <SortHeader field="description" sort={query.sort} onSort={(sort) => update({ sort })}>Incident</SortHeader>
                <SortHeader field="severity" sort={query.sort} onSort={(sort) => update({ sort })}>Severity</SortHeader>
                <SortHeader field="status" sort={query.sort} onSort={(sort) => update({ sort })}>Status</SortHeader>
                <SortHeader field="createdAt" sort={query.sort} onSort={(sort) => update({ sort })}>Opened</SortHeader>
                <SortHeader field="resolvedAt" sort={query.sort} onSort={(sort) => update({ sort })}>Time to resolve</SortHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-fjord-800">
              {!result
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <Skeleton className="h-8" />
                      </td>
                    </tr>
                  ))
                : result.content.map((incident) => {
                    const resolvedIn = incident.resolvedAt ? minutesBetween(incident.createdAt, incident.resolvedAt) : null;
                    return (
                      <tr
                        key={incident.id}
                        onClick={() => setParam("open", incident.id)}
                        className={`cursor-pointer hover:bg-fjord-850/60 ${openId === incident.id ? "bg-fjord-850" : ""}`}
                      >
                        <td className="px-4 py-3 text-fjord-400">{incident.id}</td>
                        <td className="max-w-md px-4 py-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setParam("open", incident.id);
                            }}
                            className="block max-w-full truncate text-left font-semibold text-fjord-100 hover:underline"
                          >
                            {incident.description}
                          </button>
                          <span className="text-fjord-400">
                            {incident.nodeName}
                            {incident.autoGenerated ? <span className="ml-2 text-xs text-fjord-300">detected automatically</span> : null}
                          </span>
                        </td>
                        <td className="px-4 py-3"><SeverityBadge severity={incident.severity} /></td>
                        <td className="px-4 py-3"><IncidentStatusBadge status={incident.status} /></td>
                        <td className="px-4 py-3 text-fjord-300">{formatRelative(incident.createdAt, now)}</td>
                        <td className="px-4 py-3 text-fjord-300">
                          {resolvedIn != null ? formatDuration(resolvedIn) : <span className="text-fjord-400">Ongoing</span>}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {result && result.totalElements === 0 ? (
          <EmptyState
            title={filtered ? "No incidents match these filters" : query.deleted ? "No deleted incidents" : "No incidents"}
            action={
              filtered ? (
                <Button
                  onClick={() => {
                    update({ q: "", status: "", severity: "" });
                    setParam("nodeId", null);
                  }}
                >
                  Clear filters
                </Button>
              ) : null
            }
          >
            {filtered ? "Try a different search or filter." : query.deleted ? "Deleted incidents appear here and can be restored." : "Incidents appear here when the detector spots an outage or someone raises one."}
          </EmptyState>
        ) : null}

        {result ? (
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            totalElements={result.totalElements}
            size={query.size}
            onPageChange={(page) => setQuery((prev) => ({ ...prev, page }))}
            onSizeChange={(size) => update({ size })}
          />
        ) : null}
      </div>

      {createOpen ? <IncidentFormModal open defaultNodeId={nodeId ?? ""} onClose={closeCreate} onSave={save} /> : null}

      {openId ? (
        <IncidentDrawer
          key={openId}
          incidentId={openId}
          onClose={() => setParam("open", null)}
          onChanged={load}
          onDelete={remove}
          onRestore={restore}
        />
      ) : null}
    </div>
  );
}

export default IncidentsPage;
