import { useState } from "react";
import FormField from "../common/FormField";

function IncidentForm({ onAddIncident }) {
  const [formData, setFormData] = useState({
    description: "",
    severity: "LOW",
    status: "OPEN",
    nodeId: "",
  });

  const [formError, setFormError] = useState("");

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case "LOW":
        return {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
        };
      case "MEDIUM":
        return {
          backgroundColor: "#FFF8E1",
          color: "#F57F17",
        };
      case "HIGH":
        return {
          backgroundColor: "#FFF3E0",
          color: "#EF6C00",
        };
      case "CRITICAL":
        return {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
        };
      default:
        return {
          backgroundColor: "#FFFFFF",
          color: "#111827",
        };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "OPEN":
        return {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
        };
      case "IN_PROGRESS":
        return {
          backgroundColor: "#FFF3E0",
          color: "#EF6C00",
        };
      case "RESOLVED":
        return {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
        };
      case "CLOSED":
        return {
          backgroundColor: "#E3F2FD",
          color: "#1565C0",
        };
      default:
        return {
          backgroundColor: "#FFFFFF",
          color: "#111827",
        };
    }
  };

  const handleChange = (event) => {
    setFormError("");

    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!formData.description.trim() || !formData.nodeId) {
      setFormError("Description and Node ID are required.");
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
        severity: "LOW",
        status: "OPEN",
        nodeId: "",
      });
    } catch (error) {
      console.error("Incident form error:", error);

      if (error.response?.data?.message) {
        setFormError(error.response.data.message);
      } else {
        setFormError("Failed to add incident.");
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Add New Incident</h3>
        <p style={styles.subtitle}>
          Enter the incident details below. Severity and status are selected separately.
        </p>
      </div>

      {formError && <p style={styles.error}>{formError}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldsGrid}>
          <FormField label="Incident Description" required>
            <input
              type="text"
              name="description"
              placeholder="Enter incident description"
              value={formData.description}
              onChange={handleChange}
              style={styles.input}
            />
          </FormField>

          <FormField label="Node ID" required>
            <input
              type="number"
              name="nodeId"
              placeholder="Enter node ID"
              value={formData.nodeId}
              onChange={handleChange}
              style={styles.input}
            />
          </FormField>

          <FormField label="Incident Severity" required>
            <select
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              style={{
                ...styles.select,
                ...getSeverityStyle(formData.severity),
              }}
            >
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </FormField>

          <FormField label="Incident Status" required>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                ...styles.select,
                ...getStatusStyle(formData.status),
              }}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </FormField>
        </div>

        <div style={styles.buttonRow}>
          <button type="submit" style={styles.primaryButton}>
            Add Incident
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  container: {
    background: "#fff",
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  header: {
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0 0",
    color: "#6B7280",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  fieldsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    backgroundColor: "#fff",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    fontWeight: "600",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: "#1565C0",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
  },
  error: {
    color: "#C62828",
    marginBottom: "12px",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export default IncidentForm;