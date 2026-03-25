import { useEffect, useState } from "react";
import IncidentForm from "../components/incident/IncidentForm";
import IncidentFilter from "../components/incident/IncidentFilter";
import IncidentTable from "../components/incident/IncidentTable";
import {
  createIncident,
  deleteIncident,
  filterIncidentsByStatus,
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
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [deletedNodeIds, setDeletedNodeIds] = useState([]);

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
      const ids = deletedNodes.map((node) => node.id);
      setDeletedNodeIds(ids);
    } catch (error) {
      console.error("Fetch deleted nodes error:", error);
      setDeletedNodeIds([]);
    }
  };

  const fetchActiveIncidents = async () => {
    const response = await getAllIncidents();
    setIncidents(extractIncidentArray(response));
  };

  const fetchDeletedIncidents = async () => {
    const response = await getDeletedIncidents();
    setIncidents(extractIncidentArray(response));
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setPageError("");

      if (showDeleted) {
        await Promise.all([fetchDeletedIncidents(), fetchDeletedNodeIds()]);
      } else if (selectedStatus) {
        const response = await filterIncidentsByStatus(selectedStatus);
        setIncidents(extractIncidentArray(response));
      } else {
        await fetchActiveIncidents();
      }
    } catch (error) {
      console.error("Fetch incidents error:", error);

      if (error.response?.data?.message) {
        setPageError(error.response.data.message);
      } else {
        setPageError("Failed to load incidents.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [showDeleted]);

  const handleAddIncident = async (incidentData) => {
    await createIncident(incidentData);
    setShowDeleted(false);
    setSelectedStatus("");
    await fetchActiveIncidents();
  };

  const handleStatusFilterChange = async (status) => {
    setSelectedStatus(status);
    setShowDeleted(false);

    if (!status) {
      await fetchIncidents();
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const response = await filterIncidentsByStatus(status);
      setIncidents(extractIncidentArray(response));
    } catch (error) {
      console.error("Filter incidents error:", error);

      if (error.response?.data?.message) {
        setPageError(error.response.data.message);
      } else {
        setPageError("Failed to filter incidents.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = async () => {
    setSelectedStatus("");
    setShowDeleted(false);
    await fetchActiveIncidents();
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateIncidentStatus(id, status);

      if (selectedStatus) {
        const response = await filterIncidentsByStatus(selectedStatus);
        setIncidents(extractIncidentArray(response));
      } else {
        await fetchActiveIncidents();
      }
    } catch (error) {
      console.error("Update incident status error:", error);
      alert("Failed to update incident status.");
    }
  };

  const handleDeleteIncident = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this incident?");
    if (!confirmed) return;

    try {
      await deleteIncident(id);

      if (selectedStatus) {
        const response = await filterIncidentsByStatus(selectedStatus);
        setIncidents(extractIncidentArray(response));
      } else {
        await fetchActiveIncidents();
      }
    } catch (error) {
      console.error("Delete incident error:", error);
      alert("Failed to delete incident.");
    }
  };

  const handleRestoreIncident = async (incident) => {
    const isParentNodeDeleted = deletedNodeIds.includes(incident.nodeId);

    if (isParentNodeDeleted) {
      alert(
        "Cannot restore this incident because its node is deleted. Restore the node first."
      );
      return;
    }

    try {
      await restoreIncident(incident.id);
      await Promise.all([fetchDeletedIncidents(), fetchDeletedNodeIds()]);
    } catch (error) {
      console.error("Restore incident error:", error);
      alert("Failed to restore incident.");
    }
  };

  const handleShowActive = async () => {
    setShowDeleted(false);
    setSelectedStatus("");
    await fetchActiveIncidents();
  };

  const handleShowDeleted = async () => {
    setSelectedStatus("");
    setShowDeleted(true);
    await Promise.all([fetchDeletedIncidents(), fetchDeletedNodeIds()]);
  };

  return (
    <div style={styles.page}>
      <h2>Incidents Management</h2>

      {!showDeleted && <IncidentForm onAddIncident={handleAddIncident} />}

      {!showDeleted && (
        <IncidentFilter
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusFilterChange}
          onClearFilter={handleClearFilter}
        />
      )}

      <div style={styles.toggleRow}>
        <button
          onClick={handleShowActive}
          style={!showDeleted ? styles.activeToggleButton : styles.toggleButton}
        >
          Show Active Incidents
        </button>

        <button
          onClick={handleShowDeleted}
          style={showDeleted ? styles.activeToggleButton : styles.toggleButton}
        >
          Show Deleted Incidents
        </button>
      </div>

      {showDeleted && (
        <p style={styles.infoText}>
          Deleted incidents can be restored only if their parent node is active.
        </p>
      )}

      {loading ? (
        <p>Loading incidents...</p>
      ) : pageError ? (
        <p style={styles.error}>{pageError}</p>
      ) : (
        <IncidentTable
          incidents={incidents}
          onStatusUpdate={handleStatusUpdate}
          onDeleteIncident={handleDeleteIncident}
          onRestoreIncident={handleRestoreIncident}
          showDeleted={showDeleted}
          deletedNodeIds={deletedNodeIds}
        />
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
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  toggleButton: {
    padding: "10px 16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
  },
  activeToggleButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#222",
    color: "#fff",
    cursor: "pointer",
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