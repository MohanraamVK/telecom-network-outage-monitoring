import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/common/EmptyState";
import PageControlsCard from "../components/common/PageControlsCard";
import Pagination from "../components/common/Pagination";
import TableSkeleton from "../components/common/TableSkeleton";
import ViewToggle from "../components/common/ViewToggle";
import IncidentForm from "../components/incident/IncidentForm";
import IncidentTable from "../components/incident/IncidentTable";
import { useConfirmation } from "../context/ConfirmationContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import {
  createIncident,
  deleteIncident,
  getAllIncidents,
  getDeletedIncidents,
  restoreIncident,
  updateIncidentStatus,
} from "../services/incidentService";
import { getDeletedNodes } from "../services/nodeService";

function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedNodeIds, setDeletedNodeIds] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { showSuccess, showError, showWarning } = useToast();
  const { confirm } = useConfirmation();
  const { canEdit } = useAuth();

  const extractIncidentArray = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  };

  const extractNodeArray = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  };

  const fetchDeletedNodeIds = async () => {
    try {
      const response = await getDeletedNodes();
      const deletedNodes = extractNodeArray(response);
      setDeletedNodeIds(deletedNodes.map((node) => node.id));
    } catch (error) {
      console.error("Fetch deleted nodes error:", error);
      setDeletedNodeIds([]);
    }
  };

  const fetchActiveIncidents = async () => {
    const response = await getAllIncidents();
    setIncidents(extractIncidentArray(response));
    setCurrentPage(1);
  };

  const fetchDeletedIncidents = async () => {
    const response = await getDeletedIncidents();
    setIncidents(extractIncidentArray(response));
    setCurrentPage(1);
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setPageError("");

      if (showDeleted) {
        await Promise.all([fetchDeletedIncidents(), fetchDeletedNodeIds()]);
      } else {
        await fetchActiveIncidents();
      }
    } catch (error) {
      console.error("Fetch incidents error:", error);

      if (error.response?.data?.message) {
        setPageError(error.response.data.message);
        showError("Failed to load incidents", error.response.data.message);
      } else {
        setPageError("Failed to load incidents.");
        showError("Failed to load incidents", "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [showDeleted]);

  const filteredIncidents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return incidents;
    }

    return incidents.filter((incident) => {
      const searchableText = [
        incident.id,
        incident.description,
        incident.severity,
        incident.status,
        incident.nodeId,
        incident.nodeName,
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [incidents, searchTerm]);

  const sortedIncidents = useMemo(() => {
    const sorted = [...filteredIncidents];

    sorted.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];

      if (sortBy === "id" || sortBy === "nodeId") {
        aValue = Number(aValue ?? 0);
        bValue = Number(bValue ?? 0);
      } else {
        aValue = String(aValue ?? "").toLowerCase();
        bValue = String(bValue ?? "").toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredIncidents, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedIncidents.length / itemsPerPage));

  const paginatedIncidents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedIncidents.slice(startIndex, endIndex);
  }, [sortedIncidents, currentPage, itemsPerPage]);

  const handleAddIncident = async (incidentData) => {
    try {
      await createIncident(incidentData);
      setShowDeleted(false);
      setSearchTerm("");
      await fetchActiveIncidents();
      showSuccess("Incident added", "The incident was created successfully.");
    } catch (error) {
      console.error("Add incident error:", error);
      showError(
        "Failed to add incident",
        error.response?.data?.message || "Please try again."
      );
      throw error;
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateIncidentStatus(id, status);
      await fetchActiveIncidents();
      showSuccess("Status updated", `Incident status changed to ${status}.`);
    } catch (error) {
      console.error("Update incident status error:", error);
      showError(
        "Failed to update status",
        error.response?.data?.message || "Please try again."
      );
    }
  };

  const handleDeleteIncident = async (id) => {
    const confirmed = await confirm({
      title: "Delete Incident",
      message:
        "Are you sure you want to delete this incident? It will be moved to deleted records.",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmVariant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteIncident(id);
      await fetchActiveIncidents();
      showSuccess("Incident deleted", "The incident was moved to deleted records.");
    } catch (error) {
      console.error("Delete incident error:", error);
      showError(
        "Failed to delete incident",
        error.response?.data?.message || "Please try again."
      );
    }
  };

  const handleRestoreIncident = async (incident) => {
    const isParentNodeDeleted = deletedNodeIds.includes(incident.nodeId);

    if (isParentNodeDeleted) {
      showWarning(
        "Restore not allowed",
        "Cannot restore this incident because its node is deleted. Restore the node first."
      );
      return;
    }

    const confirmed = await confirm({
      title: "Restore Incident",
      message: "Do you want to restore this incident?",
      confirmText: "Restore",
      cancelText: "Cancel",
      confirmVariant: "success",
    });

    if (!confirmed) return;

    try {
      await restoreIncident(incident.id);
      await Promise.all([fetchDeletedIncidents(), fetchDeletedNodeIds()]);
      showSuccess("Incident restored", "The incident was restored successfully.");
    } catch (error) {
      console.error("Restore incident error:", error);
      showError(
        "Failed to restore incident",
        error.response?.data?.message || "Please try again."
      );
    }
  };

  const handleShowActive = async () => {
    setShowDeleted(false);
    setSearchTerm("");
    setCurrentPage(1);
    await fetchActiveIncidents();
  };

  const handleShowDeleted = async () => {
    setSearchTerm("");
    setShowDeleted(true);
    setCurrentPage(1);
    await Promise.all([fetchDeletedIncidents(), fetchDeletedNodeIds()]);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleSortByChange = (event) => {
    setSortBy(event.target.value);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (event) => {
    setSortOrder(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  return (
    <div style={styles.page}>
      <h2>Incidents Management</h2>

      {!showDeleted && canEdit && <IncidentForm onAddIncident={handleAddIncident} />}

      <PageControlsCard
        title="Incident Controls"
        subtitle="Search, sort, and switch between active and deleted incidents."
      >
        <div style={styles.toggleRow}>
          <ViewToggle
            activeLabel="Active"
            deletedLabel="Deleted"
            showDeleted={showDeleted}
            onShowActive={handleShowActive}
            onShowDeleted={handleShowDeleted}
          />
        </div>

        <div style={styles.controlsGrid}>
          <div style={styles.controlField}>
            <label style={styles.label}>Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={
                showDeleted
                  ? "Search deleted incidents by description, severity, status, node id, or node name"
                  : "Search incidents by description, severity, status, node id, or node name"
              }
              style={styles.input}
            />
          </div>

          <div style={styles.controlField}>
            <label style={styles.label}>Sort by</label>
            <select
              value={sortBy}
              onChange={handleSortByChange}
              style={styles.select}
            >
              <option value="id">ID</option>
              <option value="description">Description</option>
              <option value="severity">Severity</option>
              <option value="status">Status</option>
              <option value="nodeId">Node ID</option>
              <option value="nodeName">Node Name</option>
            </select>
          </div>

          <div style={styles.controlField}>
            <label style={styles.label}>Sort order</label>
            <select
              value={sortOrder}
              onChange={handleSortOrderChange}
              style={styles.select}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </PageControlsCard>

      {showDeleted && (
        <p style={styles.infoText}>
          Deleted incidents can be restored only if their parent node is active.
        </p>
      )}

      {loading ? (
        <TableSkeleton
          rows={5}
          columns={7}
          title={showDeleted ? "Loading deleted incidents..." : "Loading active incidents..."}
        />
      ) : pageError ? (
        <p style={styles.error}>{pageError}</p>
      ) : sortedIncidents.length === 0 ? (
        <EmptyState
          icon={showDeleted ? "🗑️" : "🚨"}
          title={showDeleted ? "No deleted incidents found" : "No incidents found"}
          description={
            searchTerm
              ? "Try adjusting your search or clear the search term."
              : showDeleted
              ? "Deleted incidents will appear here."
              : "Start by creating a new incident."
          }
          actionLabel={searchTerm ? "Clear Search" : undefined}
          onAction={searchTerm ? handleClearSearch : undefined}
        />
      ) : (
        <>
          <IncidentTable
            incidents={paginatedIncidents}
            onStatusUpdate={handleStatusUpdate}
            onDeleteIncident={handleDeleteIncident}
            onRestoreIncident={handleRestoreIncident}
            readOnly={!canEdit}
            showDeleted={showDeleted}
            deletedNodeIds={deletedNodeIds}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedIncidents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "30px auto",
    padding: "20px",
  },
  toggleRow: {
    width: "100%",
  },
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    alignItems: "end",
  },
  controlField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
  infoText: {
    marginBottom: "15px",
    color: "#555",
  },
  error: {
    color: "red",
  },
};

export default IncidentsPage;