import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const { user, logout, canEdit } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header style={styles.header}>
      <div style={styles.inner}>
        <div style={styles.brandSection}>
          <div style={styles.logo}>📡</div>
          <div>
            <h1 style={styles.brandTitle}>Telecom Dashboard</h1>
            <p style={styles.brandSubtitle}>Network outage monitoring system</p>
          </div>
        </div>

        <nav style={styles.nav}>
          <NavLink
            to="/"
            end
            style={({ isActive }) =>
              isActive ? { ...styles.link, ...styles.activeLink } : styles.link
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/nodes"
            style={({ isActive }) =>
              isActive ? { ...styles.link, ...styles.activeLink } : styles.link
            }
          >
            Nodes
          </NavLink>

          <NavLink
            to="/incidents"
            style={({ isActive }) =>
              isActive ? { ...styles.link, ...styles.activeLink } : styles.link
            }
          >
            Incidents
          </NavLink>
        </nav>

        <div style={styles.userSection}>
          <span style={styles.userText}>{user?.username || "User"}</span>
          {!canEdit ? (
            <span style={styles.readOnlyBadge} title="This account can view data but not change it">
              Read-only
            </span>
          ) : null}
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    position: "sticky",
    top: 0,
    zIndex: 1000,
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  inner: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "14px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  brandSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logo: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    backgroundColor: "#e0f2fe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
  },
  brandTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#111827",
  },
  brandSubtitle: {
    margin: "2px 0 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },
  nav: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  link: {
    textDecoration: "none",
    color: "#374151",
    padding: "10px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
  },
  activeLink: {
    backgroundColor: "#111827",
    color: "#ffffff",
  },
  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  readOnlyBadge: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#92400E",
    backgroundColor: "#FEF3C7",
    padding: "4px 8px",
    borderRadius: "999px",
  },
  userText: {
    fontSize: "14px",
    color: "#374151",
    fontWeight: "600",
  },
  logoutButton: {
    border: "none",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    padding: "9px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
};

export default Navbar;