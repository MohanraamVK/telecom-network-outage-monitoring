import Toast from "./Toast";

function ToastContainer({ toasts, removeToast }) {
  return (
    <div style={styles.container}>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    zIndex: 9999,
  },
};

export default ToastContainer;