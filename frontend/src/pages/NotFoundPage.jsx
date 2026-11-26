import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🔎</div>
        <h1 style={styles.title}>404 - Page Not Found</h1>
        <p style={styles.description}>
          The page you are looking for does not exist or may have been moved.
        </p>

        <Link to="/" style={styles.button}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "fadeInUp 0.35s ease-out",
  },
  card: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "40px 24px",
    textAlign: "center",
  },
  icon: {
    fontSize: "42px",
    marginBottom: "12px",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "28px",
    color: "#111827",
  },
  description: {
    margin: 0,
    color: "#6b7280",
    fontSize: "15px",
    lineHeight: "1.5",
  },
  button: {
    display: "inline-block",
    marginTop: "20px",
    textDecoration: "none",
    backgroundColor: "#1565C0",
    color: "#ffffff",
    padding: "10px 16px",
    borderRadius: "8px",
    fontWeight: "600",
  },
};

export default NotFoundPage;