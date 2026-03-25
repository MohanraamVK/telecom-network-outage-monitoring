function IncidentTable({
  incidents,
  onStatusUpdate,
  onDeleteIncident,
  onRestoreIncident,
  showDeleted,
  deletedNodeIds = [],
}) {
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
                <td style={styles.td}>{incident.severity || "-"}</td>
                <td style={styles.td}>{incident.status || "-"}</td>
                <td style={styles.td}>{incident.nodeId ?? "-"}</td>
                <td style={styles.td}>{incident.nodeName || "-"}</td>
                <td style={styles.td}>
                  <div style={styles.actionGroup}>
                    {!showDeleted ? (
                      <>
                        <select
                          value={incident.status || ""}
                          onChange={(event) =>
                            onStatusUpdate(incident.id, event.target.value)
                          }
                          style={styles.select}
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
                          <span style={styles.warningText}>
                            Restore node first
                          </span>
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
  actionGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  select: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  deleteButton: {
    backgroundColor: "#c62828",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  restoreButton: {
    backgroundColor: "#2e7d32",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  disabledRestoreButton: {
    backgroundColor: "#bdbdbd",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "not-allowed",
  },
  warningText: {
    color: "#c62828",
    fontSize: "13px",
    fontWeight: "500",
  },
};

export default IncidentTable;