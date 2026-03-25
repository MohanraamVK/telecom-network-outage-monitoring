function StatsCard({ title, value }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{title}</h3>
      <p style={styles.value}>{value}</p>
    </div>
  );
}

const styles = {
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "18px",
  },
  value: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "bold",
  },
};

export default StatsCard;