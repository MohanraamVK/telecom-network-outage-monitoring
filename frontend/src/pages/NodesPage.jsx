import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import NodeFormModal from "../components/node/NodeFormModal";
import { NodeStatusBadge } from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { EmptyState, ErrorBanner, Skeleton } from "../components/ui/Feedback";
import { Pagination, SearchInput, Segmented, SortHeader } from "../components/ui/Toolbar";
import { useConfirmation } from "../context/ConfirmationContext";
import { useLive, useLiveRefresh } from "../context/LiveContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { useReload } from "../hooks/useReload";
import { useNow } from "../hooks/useNow";
import { errorMessage } from "../services/errors";
import { createNode, deleteNode, restoreNode, searchNodes, updateNode } from "../services/nodeService";
import { formatRelative } from "../utils/time";

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Up" },
  { value: "DOWN", label: "Down" },
  { value: "MAINTENANCE", label: "Maintenance" },
];

function NodesPage() {
  const { canEdit } = useAuth();
  const { health } = useLive();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmation();
  const now = useNow(5000);

  const [query, setQuery] = useState({ q: "", status: "", deleted: false, page: 0, size: 10, sort: "name,asc" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState({ open: false, node: null });
  const [params, setParams] = useSearchParams();
  // "/nodes?new=1" (from the command palette) opens the add-node form
  const editorOpen = editor.open || (canEdit && params.get("new") === "1");

  const closeEditor = () => {
    setEditor({ open: false, node: null });
    if (params.has("new")) {
      const next = new URLSearchParams(params);
      next.delete("new");
      setParams(next, { replace: true });
    }
  };

  const load = useCallback(async () => {
    try {
      setResult(await searchNodes(query));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Nodes could not be loaded."));
    }
  }, [query]);

  useReload(load);

  useLiveRefresh(["node.changed", "incident.changed"], load);

  const update = (patch) => setQuery((prev) => ({ ...prev, page: 0, ...patch }));
  const onSearch = useCallback((q) => setQuery((prev) => ({ ...prev, q, page: 0 })), []);

  // Overlay live status/latency from the monitoring stream onto the page of results
  const liveById = useMemo(() => new Map((health ?? []).map((n) => [n.id, n])), [health]);
  const rows = (result?.content ?? []).map((node) => {
    const live = liveById.get(node.id);
    return live && !node.deleted
      ? { ...node, status: live.status, latencyMs: live.latencyMs, lastHeartbeatAt: live.lastHeartbeatAt ?? node.lastHeartbeatAt }
      : node;
  });

  const save = async (values) => {
    if (editor.node) {
      await updateNode(editor.node.id, values);
      showSuccess("Node updated", values.name);
    } else {
      await createNode(values);
      showSuccess("Node added", values.name);
    }
    closeEditor();
    load();
  };

  const remove = async (node) => {
    const ok = await confirm({
      title: `Delete ${node.name}?`,
      message: "The node and its incidents move to Deleted. You can restore them later.",
      confirmText: "Delete node",
    });
    if (!ok) return;
    try {
      await deleteNode(node.id);
      showSuccess("Node deleted", node.name);
      load();
    } catch (err) {
      showError("Node not deleted", errorMessage(err));
    }
  };

  const restore = async (node) => {
    try {
      await restoreNode(node.id);
      showSuccess("Node restored", node.name);
      load();
    } catch (err) {
      showError("Node not restored", errorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Nodes</h1>
          <p className="mt-1 text-fjord-400">Towers, routers and edge sites in the network.</p>
        </div>
        {canEdit && !query.deleted ? (
          <Button variant="primary" onClick={() => setEditor({ open: true, node: null })}>
            Add node
          </Button>
        ) : null}
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={query.q} onChange={onSearch} placeholder="Search name, location or #id" />
        <Segmented label="Status" value={query.status} onChange={(status) => update({ status })} options={STATUS_FILTERS} />
        <Segmented
          label="Show"
          value={query.deleted ? "deleted" : "active"}
          onChange={(v) => update({ deleted: v === "deleted", status: "" })}
          options={[
            { value: "active", label: "Active" },
            { value: "deleted", label: "Deleted" },
          ]}
        />
      </div>

      {error ? <ErrorBanner onRetry={load}>{error}</ErrorBanner> : null}

      <div className="overflow-hidden rounded-lg border border-fjord-800 bg-fjord-900">
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-fjord-800 text-fjord-400">
              <tr>
                <SortHeader field="name" sort={query.sort} onSort={(sort) => update({ sort })}>Node</SortHeader>
                <SortHeader field="status" sort={query.sort} onSort={(sort) => update({ sort })}>Status</SortHeader>
                <th scope="col" className="px-4 py-3 font-medium">Latency</th>
                <SortHeader field="lastHeartbeatAt" sort={query.sort} onSort={(sort) => update({ sort })}>Last heartbeat</SortHeader>
                <th scope="col" className="px-4 py-3 font-medium">Open incidents</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fjord-800">
              {!result
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <Skeleton className="h-8" />
                      </td>
                    </tr>
                  ))
                : rows.map((node) => (
                    <tr key={node.id} className="hover:bg-fjord-850/60">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-fjord-100">{node.name}</p>
                        <p className="text-fjord-400">{node.location}</p>
                      </td>
                      <td className="px-4 py-3">
                        <NodeStatusBadge status={node.status} />
                      </td>
                      <td className="px-4 py-3 text-fjord-100">
                        {node.status === "DOWN" || node.latencyMs == null ? <span className="text-fjord-400">—</span> : `${node.latencyMs} ms`}
                      </td>
                      <td className="px-4 py-3 text-fjord-300">
                        {node.lastHeartbeatAt ? formatRelative(node.lastHeartbeatAt, now) : <span className="text-fjord-400">Never</span>}
                      </td>
                      <td className="px-4 py-3">
                        {node.openIncidentCount > 0 ? (
                          <Link to={`/incidents?nodeId=${node.id}`} className="font-semibold text-notice hover:underline">
                            {node.openIncidentCount} open
                          </Link>
                        ) : (
                          <span className="text-fjord-400">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <div className="flex justify-end gap-1">
                            {node.deleted ? (
                              <Button size="sm" onClick={() => restore(node)}>Restore</Button>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => setEditor({ open: true, node })}>Edit</Button>
                                <Button size="sm" variant="ghost" className="hover:text-outage" onClick={() => remove(node)}>Delete</Button>
                              </>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {result && result.totalElements === 0 ? (
          <EmptyState
            title={query.q || query.status ? "No nodes match these filters" : query.deleted ? "No deleted nodes" : "No nodes yet"}
            action={
              query.q || query.status ? (
                <Button onClick={() => update({ q: "", status: "" })}>Clear filters</Button>
              ) : canEdit && !query.deleted ? (
                <Button variant="primary" onClick={() => setEditor({ open: true, node: null })}>Add node</Button>
              ) : null
            }
          >
            {query.q || query.status ? "Try a different search or status." : query.deleted ? "Deleted nodes appear here and can be restored." : "Add the first tower or router to start monitoring."}
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

      {editorOpen ? (
        <NodeFormModal
          key={editor.node?.id ?? "new"}
          open
          node={editor.node}
          onClose={closeEditor}
          onSave={save}
        />
      ) : null}
    </div>
  );
}

export default NodesPage;
