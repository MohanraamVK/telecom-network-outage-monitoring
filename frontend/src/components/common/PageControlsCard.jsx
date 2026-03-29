function PageControlsCard({ title = "Controls", subtitle = "", children }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>{title}</h3>
        {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
      </div>

      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  header: {
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    fontSize: "18px",
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0 0",
    fontSize: "14px",
    color: "#6B7280",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
};

export default PageControlsCard;