import { NavLink } from "react-router-dom";

function Navbar() {
  return (
    <nav style={styles.navbar}>
      <div style={styles.brand}>Telecom Dashboard</div>

      <div style={styles.links}>
        <NavLink
          to="/"
          style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/nodes"
          style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
        >
          Nodes
        </NavLink>

        <NavLink
          to="/incidents"
          style={({ isActive }) => (isActive ? styles.activeLink : styles.link)}
        >
          Incidents
        </NavLink>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    padding: "16px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  brand: {
    fontSize: "20px",
    fontWeight: "bold",
  },
  links: {
    display: "flex",
    gap: "20px",
  },
  link: {
    color: "#d1d5db",
    textDecoration: "none",
    fontWeight: "500",
  },
  activeLink: {
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: "700",
    borderBottom: "2px solid #ffffff",
    paddingBottom: "2px",
  },
};

export default Navbar;