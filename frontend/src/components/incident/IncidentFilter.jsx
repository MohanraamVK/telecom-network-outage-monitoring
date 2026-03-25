function IncidentFilter({ selectedStatus, onStatusChange, onClearFilter }) {
  return (
    <div style={styles.container}>
      <h3>Filter Incidents</h3>

      <div style={styles.row}>
        <select
          value={selectedStatus}
          onChange={(event) => onStatusChange(event.target.value)}
          style={styles.select}
        >
          <option value="">Select status</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <button onClick={onClearFilter} style={styles.button}>
          Clear Filter
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  row: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  select: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 16px",
    fontSize: "14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#444",
    color: "#fff",
  },
};

export default IncidentFilter;