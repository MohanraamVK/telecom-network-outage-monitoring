import Skeleton from "../common/Skeleton";

function DashboardSkeleton() {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <Skeleton width="220px" height="34px" />
        <Skeleton width="420px" height="16px" style={{ marginTop: "10px" }} />
      </div>

      <section style={styles.section}>
        <Skeleton width="180px" height="24px" style={{ marginBottom: "16px" }} />
        <div style={styles.statsGrid}>
          <div style={styles.card}><Skeleton width="100px" height="14px" /><Skeleton width="80px" height="30px" style={{ marginTop: "14px" }} /></div>
          <div style={styles.card}><Skeleton width="120px" height="14px" /><Skeleton width="80px" height="30px" style={{ marginTop: "14px" }} /></div>
          <div style={styles.card}><Skeleton width="100px" height="14px" /><Skeleton width="80px" height="30px" style={{ marginTop: "14px" }} /></div>
          <div style={styles.card}><Skeleton width="110px" height="14px" /><Skeleton width="80px" height="30px" style={{ marginTop: "14px" }} /></div>
        </div>
      </section>

      <section style={styles.section}>
        <Skeleton width="140px" height="24px" style={{ marginBottom: "16px" }} />
        <div style={styles.chartGrid}>
          <div style={styles.chartCard}>
            <Skeleton width="160px" height="18px" style={{ marginBottom: "16px" }} />
            <Skeleton width="100%" height="260px" borderRadius="12px" />
          </div>

          <div style={styles.chartCard}>
            <Skeleton width="160px" height="18px" style={{ marginBottom: "16px" }} />
            <Skeleton width="100%" height="260px" borderRadius="12px" />
          </div>

          <div style={styles.chartCard}>
            <Skeleton width="160px" height="18px" style={{ marginBottom: "16px" }} />
            <Skeleton width="100%" height="260px" borderRadius="12px" />
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  section: {
    marginBottom: "28px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    minHeight: "120px",
  },
  chartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "20px",
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
};

export default DashboardSkeleton;