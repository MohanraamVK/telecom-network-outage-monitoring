function SortControls({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  options,
  label = "Sort by",
}) {
  return (
    <div style={styles.container}>
      <div style={styles.field}>
        <label htmlFor="sortBy" style={styles.label}>
          {label}
        </label>

        <select
          id="sortBy"
          value={sortBy}
          onChange={(event) => onSortByChange(event.target.value)}
          style={styles.select}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.field}>
        <label htmlFor="sortOrder" style={styles.label}>
          Sort order
        </label>

        <select
          id="sortOrder"
          value={sortOrder}
          onChange={(event) => onSortOrderChange(event.target.value)}
          style={styles.select}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: "220px",
    flex: "1 1 220px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    fontSize: "14px",
  },
};

export default SortControls;