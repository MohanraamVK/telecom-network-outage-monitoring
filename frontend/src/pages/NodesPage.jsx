import { useEffect, useMemo, useState } from "react";
import PageControlsCard from "../components/common/PageControlsCard";
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import SortControls from "../components/common/SortControls";
import TableSkeleton from "../components/common/TableSkeleton";
import ViewToggle from "../components/common/ViewToggle";
import NodeForm from "../components/node/NodeForm";
import NodeTable from "../components/node/NodeTable";
import { useConfirmation } from "../context/ConfirmationContext";
import { useToast } from "../context/ToastContext";
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

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const { showSuccess, showError, showInfo } = useToast();
  const { confirm } = useConfirmation();

  const sortOptions = [
    { value: "id", label: "ID" },
    { value: "name", label: "Name" },
    { value: "location", label: "Location" },
    { value: "status", label: "Status" },
  ];

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
      const extractedNodes = extractNodeArray(response);

      setNodes(extractedNodes);
      setCurrentPage(1);
    } catch (error) {
      console.error("Fetch nodes error:", error);
      setPageError("Failed to load nodes.");
      showError("Failed to load nodes", "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNodes(showDeleted);
  }, [showDeleted]);

  const filteredNodes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return nodes;
    }

    return nodes.filter((node) => {
      const searchableText = [node.id, node.name, node.location, node.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [nodes, searchTerm]);

  const sortedNodes = useMemo(() => {
    const sorted = [...filteredNodes];

    sorted.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];

      if (sortBy === "id") {
        aValue = Number(aValue ?? 0);
        bValue = Number(bValue ?? 0);
      } else {
        aValue = String(aValue ?? "").toLowerCase();
        bValue = String(bValue ?? "").toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredNodes, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedNodes.length / itemsPerPage));

  const paginatedNodes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedNodes.slice(startIndex, endIndex);
  }, [sortedNodes, currentPage, itemsPerPage]);

  const handleAddNode = async (nodeData) => {
    try {
      await createNode(nodeData);
      await fetchNodes(false);
      setSearchTerm("");
      showSuccess("Node added", "The node was created successfully.");
    } catch (error) {
      console.error("Add node error:", error);
      showError(
        "Failed to add node",
        error.response?.data?.message || "Please try again."
      );
      throw error;
    }
  };

  const handleEditNode = (node) => {
    setEditingNode(node);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showInfo("Edit mode enabled", `Editing node: ${node.name || "Unnamed node"}`);
  };

  const handleUpdateNode = async (id, nodeData) => {
    try {
      await updateNode(id, nodeData);
      setEditingNode(null);
      await fetchNodes(false);
      showSuccess("Node updated", "The node was updated successfully.");
    } catch (error) {
      console.error("Update node error:", error);
      showError(
        "Failed to update node",
        error.response?.data?.message || "Please try again."
      );
      throw error;
    }
  };

  const handleCancelEdit = () => {
    setEditingNode(null);
    showInfo("Edit cancelled", "Returned to add node mode.");
  };

  const handleDeleteNode = async (id) => {
    const confirmed = await confirm({
      title: "Delete Node",
      message: "Are you sure you want to delete this node? It will be moved to deleted records.",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmVariant: "danger",
    });

    if (!confirmed) return;

    try {
      await deleteNode(id);

      if (editingNode && editingNode.id === id) {
        setEditingNode(null);
      }

      await fetchNodes(false);
      showSuccess("Node deleted", "The node was moved to deleted records.");
    } catch (error) {
      console.error("Delete node error:", error);
      showError(
        "Failed to delete node",
        error.response?.data?.message || "Please try again."
      );
    }
  };

  const handleRestoreNode = async (id) => {
    const confirmed = await confirm({
      title: "Restore Node",
      message: "Do you want to restore this node?",
      confirmText: "Restore",
      cancelText: "Cancel",
      confirmVariant: "success",
    });

    if (!confirmed) return;

    try {
      await restoreNode(id);
      await fetchNodes(true);
      showSuccess("Node restored", "The node was restored successfully.");
    } catch (error) {
      console.error("Restore node error:", error);
      showError(
        "Failed to restore node",
        error.response?.data?.message || "Please try again."
      );
    }
  };

  const handleShowActive = () => {
    setEditingNode(null);
    setShowDeleted(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleShowDeleted = () => {
    setEditingNode(null);
    setShowDeleted(true);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSortByChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const handleSortOrderChange = (value) => {
    setSortOrder(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
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

      <PageControlsCard
        title="Node Controls"
        subtitle="Search, sort, and switch between active and deleted nodes."
      >
        <div style={styles.topRow}>
          <ViewToggle
            activeLabel="Show Active Nodes"
            deletedLabel="Show Deleted Nodes"
            showDeleted={showDeleted}
            onShowActive={handleShowActive}
            onShowDeleted={handleShowDeleted}
          />
        </div>

        <div style={styles.searchRow}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={
              showDeleted
                ? "Search deleted nodes by id, name, location, or status"
                : "Search active nodes by id, name, location, or status"
            }
          />
        </div>

        <div style={styles.sortRow}>
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={handleSortByChange}
            onSortOrderChange={handleSortOrderChange}
            options={sortOptions}
            label="Sort nodes by"
          />
        </div>
      </PageControlsCard>

      {loading ? (
        <TableSkeleton
          rows={5}
          columns={5}
          title={showDeleted ? "Loading deleted nodes..." : "Loading active nodes..."}
        />
      ) : pageError ? (
        <p style={styles.error}>{pageError}</p>
      ) : (
        <>
          <NodeTable
            nodes={paginatedNodes}
            onEditNode={handleEditNode}
            onDeleteNode={handleDeleteNode}
            onRestoreNode={handleRestoreNode}
            showDeleted={showDeleted}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedNodes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </>
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
  topRow: {
    width: "100%",
  },
  searchRow: {
    width: "100%",
  },
  sortRow: {
    width: "100%",
  },
  error: {
    color: "red",
  },
};

export default NodesPage;