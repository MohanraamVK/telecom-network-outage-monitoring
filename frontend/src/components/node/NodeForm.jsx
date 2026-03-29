import { useState } from "react";
import FormField from "../common/FormField";

function NodeForm({
  onAddNode,
  onUpdateNode,
  editingNode,
  onCancelEdit,
}) {
  const [formData, setFormData] = useState({
    name: editingNode?.name || "",
    location: editingNode?.location || "",
    status: editingNode?.status || "ACTIVE",
  });

  const [formError, setFormError] = useState("");

  const getStatusStyle = (status) => {
    switch (status) {
      case "ACTIVE":
        return {
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
        };
      case "DOWN":
        return {
          backgroundColor: "#FFEBEE",
          color: "#C62828",
        };
      case "MAINTENANCE":
        return {
          backgroundColor: "#FFF3E0",
          color: "#EF6C00",
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

    if (!formData.name.trim() || !formData.location.trim()) {
      setFormError("Name and Location are required.");
      return;
    }

    try {
      if (editingNode) {
        await onUpdateNode(editingNode.id, formData);
      } else {
        await onAddNode(formData);

        setFormData({
          name: "",
          location: "",
          status: "ACTIVE",
        });
      }
    } catch (error) {
      console.error("Node form error:", error);

      if (error.response?.data?.message) {
        setFormError(error.response.data.message);
      } else {
        setFormError(
          editingNode ? "Failed to update node." : "Failed to add node."
        );
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          {editingNode ? "Edit Node" : "Add New Node"}
        </h3>
        <p style={styles.subtitle}>
          Enter the node details below.
        </p>
      </div>

      {formError && <p style={styles.error}>{formError}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.fieldsGrid}>
          <FormField label="Node Name" required>
            <input
              type="text"
              name="name"
              placeholder="Enter node name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
            />
          </FormField>

          <FormField label="Location" required>
            <input
              type="text"
              name="location"
              placeholder="Enter location"
              value={formData.location}
              onChange={handleChange}
              style={styles.input}
            />
          </FormField>

          <FormField label="Node Status" required>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              style={{
                ...styles.select,
                ...getStatusStyle(formData.status),
              }}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="DOWN">DOWN</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </FormField>
        </div>

        <div style={styles.buttonRow}>
          <button type="submit" style={styles.primaryButton}>
            {editingNode ? "Update Node" : "Add Node"}
          </button>

          {editingNode && (
            <button
              type="button"
              onClick={onCancelEdit}
              style={styles.secondaryButton}
            >
              Cancel
            </button>
          )}
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
  secondaryButton: {
    backgroundColor: "#757575",
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

export default NodeForm;