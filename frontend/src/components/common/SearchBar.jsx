function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={styles.container}>
      <label style={styles.label}>Search</label>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={styles.input}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "260px",
    flex: "1 1 320px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
};

export default SearchBar;