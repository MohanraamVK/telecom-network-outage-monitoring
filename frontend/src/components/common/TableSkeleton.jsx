import Skeleton from "./Skeleton";

function TableSkeleton({ rows = 5, columns = 6, title = "Loading table..." }) {
  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: columns });

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>{title}</h3>

      <table style={styles.table}>
        <thead>
          <tr>
            {colArray.map((_, index) => (
              <th key={`head-${index}`} style={styles.th}>
                <Skeleton width="80%" height="14px" />
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rowArray.map((_, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {colArray.map((__, colIndex) => (
                <td key={`cell-${rowIndex}-${colIndex}`} style={styles.td}>
                  <Skeleton
                    width={colIndex === columns - 1 ? "90%" : "70%"}
                    height="14px"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  title: {
    marginTop: 0,
    marginBottom: "14px",
    color: "#111827",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "10px",
    borderBottom: "2px solid #e5e7eb",
    textAlign: "left",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #f3f4f6",
  },
};

export default TableSkeleton;