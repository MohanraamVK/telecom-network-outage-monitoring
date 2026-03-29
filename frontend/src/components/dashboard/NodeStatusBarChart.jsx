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

function NodeStatusBarChart({ active, down, maintenance }) {
  const data = {
    labels: ["ACTIVE", "DOWN", "MAINTENANCE"],
    datasets: [
      {
        label: "Node Count",
        data: [active, down, maintenance],
        backgroundColor: [
          "#10B981", // ACTIVE
          "#EF4444", // DOWN
          "#F59E0B", // MAINTENANCE
        ],
        borderColor: [
          "#059669",
          "#DC2626",
          "#D97706",
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
        text: "Nodes by Status",
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

export default NodeStatusBarChart;