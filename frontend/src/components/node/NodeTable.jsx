function NodeTable({
  nodes,
  onEditNode,
  onDeleteNode,
  onRestoreNode,
  showDeleted,
}) {
  const getStatusStyle = (status) => {
    switch (status) {
      case "ACTIVE":
        return {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
        };
      case "DOWN":
        return {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
        };
      case "MAINTENANCE":
        return {
          backgroundColor: "#FFF3E0",
          color: "#EF6C00",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#374151",
        };
    }
  };

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return <p>{showDeleted ? "No deleted nodes found." : "No active nodes found."}</p>;
  }

  return (
    <div style={styles.tableContainer}>
      <h3>{showDeleted ? "Deleted Nodes" : "Active Nodes"}</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Location</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {nodes.map((node) => (
            <tr key={node.id}>
              <td style={styles.td}>{node.id}</td>
              <td style={styles.td}>{node.name || "-"}</td>
              <td style={styles.td}>{node.location || "-"}</td>

              <td style={styles.td}>
                <span
                  style={{
                    ...styles.badge,
                    ...getStatusStyle(node.status),
                  }}
                >
                  {node.status || "-"}
                </span>
              </td>

              <td style={styles.td}>
                <div style={styles.actionButtons}>
                  {!showDeleted ? (
                    <>
                      <button
                        onClick={() => onEditNode(node)}
                        style={styles.editButton}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => onDeleteNode(node.id)}
                        style={styles.deleteButton}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => onRestoreNode(node.id)}
                      style={styles.restoreButton}
                    >
                      Restore
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
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
  },
  editButton: {
    backgroundColor: "#1565C0",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
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
};

export default NodeTable;