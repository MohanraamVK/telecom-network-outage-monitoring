import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Title,
  Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

function SeverityPieChart({ low, medium, high, critical }) {
  const data = {
    labels: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    datasets: [
      {
        label: "Incident Count",
        data: [low, medium, high, critical],
        backgroundColor: [
          "#4CAF50", // LOW
          "#FFC107", // MEDIUM
          "#FF9800", // HIGH
          "#F44336", // CRITICAL
        ],
        borderColor: [
          "#388E3C",
          "#FFA000",
          "#F57C00",
          "#D32F2F",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Incidents by Severity",
      },
    },
  };

  return (
    <div style={styles.card}>
      <Pie data={data} options={options} />
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
};

export default SeverityPieChart;