package com.telecom.network_monitor.dto;

public class DashboardSummaryDTO {

    private long totalNodes;
    private long activeNodes;
    private long downNodes;
    private long maintenanceNodes;
    private long deletedNodes;

    private long totalIncidents;
    private long openIncidents;
    private long inProgressIncidents;
    private long resolvedIncidents;
    private long closedIncidents;
    private long deletedIncidents;

    public DashboardSummaryDTO() {
    }

    public DashboardSummaryDTO(long totalNodes, long activeNodes, long downNodes, long maintenanceNodes, long deletedNodes,
                               long totalIncidents, long openIncidents, long inProgressIncidents,
                               long resolvedIncidents, long closedIncidents, long deletedIncidents) {
        this.totalNodes = totalNodes;
        this.activeNodes = activeNodes;
        this.downNodes = downNodes;
        this.maintenanceNodes = maintenanceNodes;
        this.deletedNodes = deletedNodes;
        this.totalIncidents = totalIncidents;
        this.openIncidents = openIncidents;
        this.inProgressIncidents = inProgressIncidents;
        this.resolvedIncidents = resolvedIncidents;
        this.closedIncidents = closedIncidents;
        this.deletedIncidents = deletedIncidents;
    }

    public long getTotalNodes() {
        return totalNodes;
    }

    public void setTotalNodes(long totalNodes) {
        this.totalNodes = totalNodes;
    }

    public long getActiveNodes() {
        return activeNodes;
    }

    public void setActiveNodes(long activeNodes) {
        this.activeNodes = activeNodes;
    }

    public long getDownNodes() {
        return downNodes;
    }

    public void setDownNodes(long downNodes) {
        this.downNodes = downNodes;
    }

    public long getMaintenanceNodes() {
        return maintenanceNodes;
    }

    public void setMaintenanceNodes(long maintenanceNodes) {
        this.maintenanceNodes = maintenanceNodes;
    }

    public long getDeletedNodes() {
        return deletedNodes;
    }

    public void setDeletedNodes(long deletedNodes) {
        this.deletedNodes = deletedNodes;
    }

    public long getTotalIncidents() {
        return totalIncidents;
    }

    public void setTotalIncidents(long totalIncidents) {
        this.totalIncidents = totalIncidents;
    }

    public long getOpenIncidents() {
        return openIncidents;
    }

    public void setOpenIncidents(long openIncidents) {
        this.openIncidents = openIncidents;
    }

    public long getInProgressIncidents() {
        return inProgressIncidents;
    }

    public void setInProgressIncidents(long inProgressIncidents) {
        this.inProgressIncidents = inProgressIncidents;
    }

    public long getResolvedIncidents() {
        return resolvedIncidents;
    }

    public void setResolvedIncidents(long resolvedIncidents) {
        this.resolvedIncidents = resolvedIncidents;
    }

    public long getClosedIncidents() {
        return closedIncidents;
    }

    public void setClosedIncidents(long closedIncidents) {
        this.closedIncidents = closedIncidents;
    }

    public long getDeletedIncidents() {
        return deletedIncidents;
    }

    public void setDeletedIncidents(long deletedIncidents) {
        this.deletedIncidents = deletedIncidents;
    }
}