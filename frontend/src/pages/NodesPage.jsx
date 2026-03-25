import { useEffect, useState } from "react";
import NodeForm from "../components/node/NodeForm";
import NodeTable from "../components/node/NodeTable";
import {
  createNode,
  deleteNode,
  getAllNodes,
  getDeletedNodes,
  restoreNode,
  updateNode,
} from "../services/nodeService";

function NodesPage() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const extractNodeArray = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }
    return [];
  };

  const fetchNodes = async (deletedMode = showDeleted) => {
    try {
      setLoading(true);
      setPageError("");

      const response = deletedMode ? await getDeletedNodes() : await getAllNodes();
      setNodes(extractNodeArray(response));
    } catch (error) {
      console.error("Fetch nodes error:", error);
      setPageError("Failed to load nodes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes(showDeleted);
  }, [showDeleted]);

  const handleAddNode = async (nodeData) => {
    await createNode(nodeData);
    await fetchNodes(false);
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateNode = async (id, nodeData) => {
    await updateNode(id, nodeData);
    setEditingNode(null);
    await fetchNodes(false);
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
  };

  const handleDeleteNode = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this node?");
    if (!confirmed) return;

    try {
      await deleteNode(id);

      if (editingNode && editingNode.id === id) {
        setEditingNode(null);
      }

      await fetchNodes(false);
    } catch (error) {
      console.error("Delete node error:", error);
      alert("Failed to delete node.");
    }
  };

  const handleRestoreNode = async (id) => {
    try {
      await restoreNode(id);
      await fetchNodes(true);
    } catch (error) {
      console.error("Restore node error:", error);
      alert("Failed to restore node.");
    }
  };

  const handleShowActive = () => {
    setEditingNode(null);
    setShowDeleted(false);
  };

  const handleShowDeleted = () => {
    setEditingNode(null);
    setShowDeleted(true);
  };

  return (
    <div style={styles.page}>
      <h2>Nodes Management</h2>

      {!showDeleted && (
        <NodeForm
          key={editingNode ? editingNode.id : "new"}
          onAddNode={handleAddNode}
          onUpdateNode={handleUpdateNode}
          editingNode={editingNode}
          onCancelEdit={handleCancelEdit}
        />
      )}

      <div style={styles.toggleRow}>
        <button
          onClick={handleShowActive}
          style={!showDeleted ? styles.activeToggleButton : styles.toggleButton}
        >
          Show Active Nodes
        </button>

        <button
          onClick={handleShowDeleted}
          style={showDeleted ? styles.activeToggleButton : styles.toggleButton}
        >
          Show Deleted Nodes
        </button>
      </div>

      {loading ? (
        <p>Loading nodes...</p>
      ) : pageError ? (
        <p style={styles.error}>{pageError}</p>
      ) : (
        <NodeTable
          nodes={nodes}
          onEditNode={handleEditNode}
          onDeleteNode={handleDeleteNode}
          onRestoreNode={handleRestoreNode}
          showDeleted={showDeleted}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1000px",
    margin: "30px auto",
    padding: "20px",
  },
  toggleRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  },
  toggleButton: {
    padding: "10px 16px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    backgroundColor: "#f5f5f5",
    cursor: "pointer",
  },
  activeToggleButton: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#222",
    color: "#fff",
    cursor: "pointer",
  },
  error: {
    color: "red",
  },
};

export default NodesPage;