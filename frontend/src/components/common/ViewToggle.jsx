function ViewToggle({
  activeLabel,
  deletedLabel,
  showDeleted,
  onShowActive,
  onShowDeleted,
}) {
  return (
    <div style={styles.container}>
      <button
        onClick={onShowActive}
        style={!showDeleted ? styles.activeButton : styles.inactiveButton}
      >
        {activeLabel}
      </button>

      <button
        onClick={onShowDeleted}
        style={showDeleted ? styles.activeButton : styles.inactiveButton}
      >
        {deletedLabel}
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  activeButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },
  inactiveButton: {
    padding: "10px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    backgroundColor: "#f9fafb",
    color: "#111827",
    cursor: "pointer",
    fontWeight: "500",
  },
};

export default ViewToggle;