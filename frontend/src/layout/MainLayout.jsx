import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function MainLayout() {
  return (
    <div style={styles.page}>
      <Navbar />
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
  },
  main: {
    maxWidth: "1280px",
    margin: "0 auto",
    padding: "24px 20px 40px",
  },
};

export default MainLayout;