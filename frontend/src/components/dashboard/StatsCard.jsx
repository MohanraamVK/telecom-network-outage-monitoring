function StatsCard({ title, value, subtitle }) {
  return (
    <div style={styles.card}>
      <p style={styles.title}>{title}</p>
      <h2 style={styles.value}>{value}</h2>
      {subtitle ? <p style={styles.subtitle}>{subtitle}</p> : null}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    minHeight: "120px",
  },
  title: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "600",
  },
  value: {
    margin: "12px 0 8px 0",
    fontSize: "32px",
    color: "#111827",
  },
  subtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#9ca3af",
  },
};

export default StatsCard;