function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) {
  if (totalItems === 0) {
    return null;
  }

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }

    return pages;
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftSection}>
        <span style={styles.infoText}>
          Total Items: <strong>{totalItems}</strong>
        </span>

        <div style={styles.rowsControl}>
          <label htmlFor="rowsPerPage" style={styles.label}>
            Rows per page:
          </label>

          <select
            id="rowsPerPage"
            value={itemsPerPage}
            onChange={(event) => onItemsPerPageChange(Number(event.target.value))}
            style={styles.select}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      <div style={styles.rightSection}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            ...styles.button,
            ...(currentPage === 1 ? styles.disabledButton : {}),
          }}
        >
          Previous
        </button>

        <div style={styles.pageNumbers}>
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              style={{
                ...styles.pageButton,
                ...(page === currentPage ? styles.activePageButton : {}),
              }}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            ...styles.button,
            ...(currentPage === totalPages ? styles.disabledButton : {}),
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  infoText: {
    fontSize: "14px",
    color: "#374151",
  },
  rowsControl: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    color: "#374151",
  },
  select: {
    padding: "8px 10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    backgroundColor: "#fff",
  },
  button: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#1f2937",
    color: "#fff",
    cursor: "pointer",
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
    color: "#6b7280",
    cursor: "not-allowed",
  },
  pageNumbers: {
    display: "flex",
    gap: "6px",
  },
  pageButton: {
    minWidth: "36px",
    height: "36px",
    borderRadius: "6px",
    border: "1px solid #d1d5db",
    backgroundColor: "#fff",
    color: "#111827",
    cursor: "pointer",
  },
  activePageButton: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "1px solid #2563eb",
    fontWeight: "700",
  },
};

export default Pagination;