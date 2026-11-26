import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Only show the seeded demo login in development, or when explicitly enabled
// (e.g. for a public portfolio demo) via VITE_SHOW_DEMO_CREDENTIALS=true.
const SHOW_DEMO_CREDENTIALS =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_CREDENTIALS === "true";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessionMessage = sessionStorage.getItem("auth_message");

    if (sessionMessage) {
      setError(sessionMessage);
      sessionStorage.removeItem("auth_message");
    }
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setError("");
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);
      await login(formData);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);

      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Login failed. Please try again.";

      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>📡</div>
          <h1 style={styles.title}>Telecom Login</h1>
          <p style={styles.subtitle}>Sign in to continue</p>
        </div>

        {error ? <p style={styles.error}>{error}</p> : null}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              style={styles.input}
              autoComplete="username"
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {SHOW_DEMO_CREDENTIALS ? (
          <div style={styles.demoBox}>
            <p style={styles.demoText}>
              <strong>Seeded admin user</strong>
            </p>
            <p style={styles.demoText}>Username: admin</p>
            <p style={styles.demoText}>Password: admin123</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
    padding: "28px",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
  },
  logo: {
    fontSize: "38px",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    color: "#111827",
  },
  subtitle: {
    margin: "8px 0 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  error: {
    color: "#c62828",
    fontSize: "14px",
    marginBottom: "12px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "11px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
  },
  button: {
    marginTop: "6px",
    backgroundColor: "#1565C0",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "11px 14px",
    cursor: "pointer",
    fontWeight: "600",
  },
  demoBox: {
    marginTop: "18px",
    padding: "12px",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
  },
  demoText: {
    margin: "2px 0",
    fontSize: "13px",
    color: "#4b5563",
  },
};

export default LoginPage;