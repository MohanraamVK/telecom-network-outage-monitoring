function Spinner({ size = 36 }) {
  return (
    <div
      style={{
        ...styles.spinner,
        width: `${size}px`,
        height: `${size}px`,
        borderWidth: `${Math.max(3, Math.floor(size / 8))}px`,
      }}
    />
  );
}

const styles = {
  spinner: {
    borderStyle: "solid",
    borderColor: "#d1d5db",
    borderTopColor: "#2563eb",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

export default Spinner;