function IncidentTable({
  incidents,
  onStatusUpdate,
  onDeleteIncident,
  onRestoreIncident,
  showDeleted,
  deletedNodeIds = [],
}) {
  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "LOW":
        return {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
        };
      case "MEDIUM":
        return {
          backgroundColor: "#FFF8E1",
          color: "#F57F17",
        };
      case "HIGH":
        return {
          backgroundColor: "#FFF3E0",
          color: "#EF6C00",
        };
      case "CRITICAL":
        return {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#374151",
        };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "OPEN":
        return {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
        };
      case "IN_PROGRESS":
        return {
          backgroundColor: "#FFF3E0",
          color: "#EF6C00",
        };
      case "RESOLVED":
        return {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
        };
      case "CLOSED":
        return {
          backgroundColor: "#E3F2FD",
          color: "#1565C0",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#374151",
        };
    }
  };

  if (!Array.isArray(incidents) || incidents.length === 0) {
    return <p>{showDeleted ? "No deleted incidents found." : "No active incidents found."}</p>;
  }

  return (
    <div style={styles.tableContainer}>
      <h3>{showDeleted ? "Deleted Incidents" : "Active Incidents"}</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Severity</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Node ID</th>
            <th style={styles.th}>Node Name</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {incidents.map((incident) => {
            const isParentNodeDeleted = deletedNodeIds.includes(incident.nodeId);

            return (
              <tr key={incident.id}>
                <td style={styles.td}>{incident.id}</td>
                <td style={styles.td}>{incident.description || "-"}</td>

                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...getSeverityStyle(incident.severity),
                    }}
                  >
                    {incident.severity || "-"}
                  </span>
                </td>

                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.badge,
                      ...getStatusStyle(incident.status),
                    }}
                  >
                    {incident.status || "-"}
                  </span>
                </td>

                <td style={styles.td}>{incident.nodeId ?? "-"}</td>
                <td style={styles.td}>{incident.nodeName || "-"}</td>

                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    {!showDeleted ? (
                      <>
                        <select
                          value={incident.status || ""}
                          onChange={(event) =>
                            onStatusUpdate(incident.id, event.target.value)
                          }
                          style={styles.statusSelect}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>

                        <button
                          onClick={() => onDeleteIncident(incident.id)}
                          style={styles.deleteButton}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => onRestoreIncident(incident)}
                          style={
                            isParentNodeDeleted
                              ? styles.disabledRestoreButton
                              : styles.restoreButton
                          }
                          disabled={isParentNodeDeleted}
                          title={
                            isParentNodeDeleted
                              ? "Cannot restore this incident because its node is deleted."
                              : "Restore incident"
                          }
                        >
                          Restore
                        </button>

                        {isParentNodeDeleted && (
                          <span style={styles.warningText}>Restore node first</span>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  tableContainer: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
  },
  th: {
    borderBottom: "2px solid #ddd",
    textAlign: "left",
    padding: "10px",
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: "10px",
    verticalAlign: "middle",
  },
  badge: {
    padding: "6px 10px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
  },
  actionButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  statusSelect: {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    minWidth: "140px",
    fontSize: "13px",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#C62828",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  restoreButton: {
    backgroundColor: "#2E7D32",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  disabledRestoreButton: {
    backgroundColor: "#BDBDBD",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "not-allowed",
  },
  warningText: {
    color: "#C62828",
    fontSize: "12px",
    fontWeight: "600",
  },
};

export default IncidentTable;