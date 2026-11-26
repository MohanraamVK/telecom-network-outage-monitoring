function EmptyState({
  title = "No data found",
  description = "",
  actionLabel,
  onAction,
}) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>📭</div>

        <h3 style={styles.title}>{title}</h3>

        {description && <p style={styles.description}>{description}</p>}

        {actionLabel && onAction && (
          <button style={styles.button} onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    animation: "fadeInUp 0.35s ease-out",
  },
  card: {
    textAlign: "center",
    padding: "40px 20px",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  icon: {
    fontSize: "40px",
    marginBottom: "10px",
  },
  title: {
    margin: "10px 0 5px",
    fontSize: "18px",
    color: "#111827",
  },
  description: {
    margin: 0,
    color: "#6B7280",
    fontSize: "14px",
    lineHeight: "1.5",
  },
  button: {
    marginTop: "15px",
    padding: "8px 14px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#1565C0",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default EmptyState;