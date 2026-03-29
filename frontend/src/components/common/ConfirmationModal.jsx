function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  const getConfirmButtonStyle = () => {
    switch (confirmVariant) {
      case "danger":
        return styles.dangerButton;
      case "success":
        return styles.successButton;
      case "primary":
        return styles.primaryButton;
      default:
        return styles.primaryButton;
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
        </div>

        <div style={styles.body}>
          <p style={styles.message}>{message}</p>
        </div>

        <div style={styles.footer}>
          <button onClick={onCancel} style={styles.cancelButton}>
            {cancelText}
          </button>

          <button onClick={onConfirm} style={getConfirmButtonStyle()}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: "20px",
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  header: {
    padding: "20px 20px 0 20px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    color: "#111827",
  },
  body: {
    padding: "12px 20px 20px 20px",
  },
  message: {
    margin: 0,
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#4B5563",
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    padding: "0 20px 20px 20px",
    flexWrap: "wrap",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    color: "#111827",
    border: "1px solid #D1D5DB",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#1565C0",
    color: "#ffffff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  successButton: {
    backgroundColor: "#2E7D32",
    color: "#ffffff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#C62828",
    color: "#ffffff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default ConfirmationModal;