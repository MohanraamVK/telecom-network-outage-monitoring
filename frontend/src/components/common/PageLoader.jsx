import Spinner from "./Spinner";

function PageLoader({ message = "Loading..." }) {
  return (
    <div style={styles.container}>
      <Spinner size={42} />
      <p style={styles.message}>{message}</p>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "220px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
  },
  message: {
    margin: 0,
    fontSize: "15px",
    color: "#4b5563",
  },
};

export default PageLoader;