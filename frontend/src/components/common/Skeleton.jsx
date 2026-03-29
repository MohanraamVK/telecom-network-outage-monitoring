function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "8px",
  style = {},
}) {
  return (
    <div
      style={{
        ...styles.skeleton,
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}

const styles = {
  skeleton: {
    background:
      "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  },
};

export default Skeleton;