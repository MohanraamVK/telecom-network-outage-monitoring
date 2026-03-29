import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div style={styles.app}>
      <Navbar />
      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
  },
  main: {
    padding: "24px",
  },
};

export default Layout;