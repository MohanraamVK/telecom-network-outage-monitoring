import { useState } from "react";

function NodeForm({ onAddNode, onUpdateNode, editingNode, onCancelEdit }) {
  const [formData, setFormData] = useState({
    name: editingNode?.name || "",
    location: editingNode?.location || "",
    status: editingNode?.status || "",
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

    if (!formData.name.trim() || !formData.location.trim() || !formData.status.trim()) {
      setError("All fields are required.");
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
          status: "",
        });
      }
    } catch (err) {
      console.error("Node form error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError(editingNode ? "Failed to update node." : "Failed to create node.");
      }
    }
  };

  return (
    <div style={styles.formContainer}>
      <h3>{editingNode ? "Edit Node" : "Add Node"}</h3>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          name="name"
          placeholder="Enter node name"
          value={formData.name}
          onChange={handleChange}
          style={styles.input}
        />

        <input
          type="text"
          name="location"
          placeholder="Enter location"
          value={formData.location}
          onChange={handleChange}
          style={styles.input}
        />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          style={styles.input}
        >
          <option value="">Select status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="DOWN">DOWN</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>

        <div style={styles.buttonRow}>
          <button type="submit" style={styles.primaryButton}>
            {editingNode ? "Update Node" : "Add Node"}
          </button>

          {editingNode && (
            <button type="button" onClick={onCancelEdit} style={styles.secondaryButton}>
              Cancel
            </button>
          )}
        </div>

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
  buttonRow: {
    display: "flex",
    gap: "10px",
  },
  primaryButton: {
    flex: 1,
    padding: "10px",
    fontSize: "14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#222",
    color: "#fff",
  },
  secondaryButton: {
    padding: "10px 16px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#f5f5f5",
    color: "#222",
  },
  error: {
    color: "red",
    margin: 0,
  },
};

export default NodeForm;