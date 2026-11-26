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

    private long lowSeverityIncidents;
    private long mediumSeverityIncidents;
    private long highSeverityIncidents;
    private long criticalSeverityIncidents;

    /** CRITICAL incidents that are still OPEN or IN_PROGRESS. */
    private long unresolvedCriticalIncidents;

    /** Share of active nodes that are ACTIVE (0-100), or 100 when there are no nodes. */
    private double networkAvailabilityPercent;

    /** Mean time to resolve (MTTR) in minutes, or null if nothing has been resolved yet. */
    private Double averageResolutionMinutes;

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

    public long getLowSeverityIncidents() {
        return lowSeverityIncidents;
    }

    public void setLowSeverityIncidents(long lowSeverityIncidents) {
        this.lowSeverityIncidents = lowSeverityIncidents;
    }

    public long getMediumSeverityIncidents() {
        return mediumSeverityIncidents;
    }

    public void setMediumSeverityIncidents(long mediumSeverityIncidents) {
        this.mediumSeverityIncidents = mediumSeverityIncidents;
    }

    public long getHighSeverityIncidents() {
        return highSeverityIncidents;
    }

    public void setHighSeverityIncidents(long highSeverityIncidents) {
        this.highSeverityIncidents = highSeverityIncidents;
    }

    public long getCriticalSeverityIncidents() {
        return criticalSeverityIncidents;
    }

    public void setCriticalSeverityIncidents(long criticalSeverityIncidents) {
        this.criticalSeverityIncidents = criticalSeverityIncidents;
    }

    public long getUnresolvedCriticalIncidents() {
        return unresolvedCriticalIncidents;
    }

    public void setUnresolvedCriticalIncidents(long unresolvedCriticalIncidents) {
        this.unresolvedCriticalIncidents = unresolvedCriticalIncidents;
    }

    public double getNetworkAvailabilityPercent() {
        return networkAvailabilityPercent;
    }

    public void setNetworkAvailabilityPercent(double networkAvailabilityPercent) {
        this.networkAvailabilityPercent = networkAvailabilityPercent;
    }

    public Double getAverageResolutionMinutes() {
        return averageResolutionMinutes;
    }

    public void setAverageResolutionMinutes(Double averageResolutionMinutes) {
        this.averageResolutionMinutes = averageResolutionMinutes;
    }
}
