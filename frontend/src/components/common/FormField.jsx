function FormField({ label, children, required = false }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      {children}
    </div>
  );
}

const styles = {
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "220px",
    flex: "1 1 220px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  required: {
    color: "#C62828",
  },
};

export default FormField;