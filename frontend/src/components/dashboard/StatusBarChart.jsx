import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function StatusBarChart({ open, inProgress, resolved, closed }) {
  const data = {
    labels: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    datasets: [
      {
        label: "Incident Count",
        data: [open, inProgress, resolved, closed],
        backgroundColor: [
          "#EF4444", // OPEN
          "#F59E0B", // IN_PROGRESS
          "#10B981", // RESOLVED
          "#3B82F6", // CLOSED
        ],
        borderColor: [
          "#DC2626",
          "#D97706",
          "#059669",
          "#2563EB",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Incidents by Status",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div style={styles.card}>
      <Bar data={data} options={options} />
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

export default StatusBarChart;