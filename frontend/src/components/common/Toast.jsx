function Toast({ toast, onRemove }) {
  const getToastStyle = (type) => {
    switch (type) {
      case "success":
        return {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
          borderLeft: "6px solid #2E7D32",
        };
      case "error":
        return {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
          borderLeft: "6px solid #C62828",
        };
      case "info":
        return {
          backgroundColor: "#E3F2FD",
          color: "#1565C0",
          borderLeft: "6px solid #1565C0",
        };
      case "warning":
        return {
          backgroundColor: "#FFF8E1",
          color: "#F57F17",
          borderLeft: "6px solid #F57F17",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#374151",
          borderLeft: "6px solid #6B7280",
        };
    }
  };

  return (
    <div style={{ ...styles.toast, ...getToastStyle(toast.type) }}>
      <div style={styles.content}>
        <strong style={styles.title}>{toast.title}</strong>
        {toast.message && <p style={styles.message}>{toast.message}</p>}
      </div>

      <button onClick={() => onRemove(toast.id)} style={styles.closeButton}>
        ×
      </button>
    </div>
  );
}

const styles = {
  toast: {
    minWidth: "320px",
    maxWidth: "420px",
    borderRadius: "10px",
    padding: "14px 16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  content: {
    flex: 1,
  },
  title: {
    display: "block",
    fontSize: "14px",
    marginBottom: "4px",
  },
  message: {
    margin: 0,
    fontSize: "13px",
    lineHeight: "1.4",
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "18px",
    cursor: "pointer",
    color: "inherit",
    lineHeight: 1,
  },
};

export default Toast;