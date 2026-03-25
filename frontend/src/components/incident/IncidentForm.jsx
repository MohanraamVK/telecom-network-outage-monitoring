import { useState } from "react";

function IncidentForm({ onAddIncident }) {
  const [formData, setFormData] = useState({
    description: "",
    severity: "",
    status: "",
    nodeId: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !formData.description.trim() ||
      !formData.severity.trim() ||
      !formData.status.trim() ||
      !formData.nodeId
    ) {
      setError("All fields are required.");
      return;
    }

    try {
      await onAddIncident({
        nodeId: Number(formData.nodeId),
        description: formData.description,
        severity: formData.severity,
        status: formData.status,
      });

      setFormData({
        description: "",
        severity: "",
        status: "",
        nodeId: "",
      });
    } catch (err) {
      console.error("Create incident error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Failed to create incident.");
      }
    }
  };

  return (
    <div style={styles.formContainer}>
      <h3>Add Incident</h3>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="description"
          placeholder="Enter incident description"
          value={formData.description}
          onChange={handleChange}
          style={styles.input}
        />

        <select
          name="severity"
          value={formData.severity}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select severity</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select status</option>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="RESOLVED">RESOLVED</option>
          <option value="CLOSED">CLOSED</option>
        </select>

        <input
          type="number"
          name="nodeId"
          placeholder="Enter node ID"
          value={formData.nodeId}
          onChange={handleChange}
          style={styles.input}
        />

        <button type="submit" style={styles.button}>
          Add Incident
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
}

const styles = {
  formContainer: {
    background: "#fff",
    padding: "20px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  input: {
    padding: "10px",
    fontSize: "14px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px",
    fontSize: "14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#222",
    color: "#fff",
  },
  error: {
    color: "red",
    margin: 0,
  },
};

export default IncidentForm;