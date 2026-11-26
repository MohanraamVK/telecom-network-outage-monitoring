package com.telecom.network_monitor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.telecom.network_monitor.enums.NodeStatus;

import java.time.LocalDateTime;
import java.util.List;

public class NodeDTO {

    private Long id;
    private String name;
    private String location;
    private NodeStatus status;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private boolean deleted = false;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private List<IncidentDTO> incidents;

    /** Most recent heartbeat (live value from the monitor when available). */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime lastHeartbeatAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private boolean monitored = true;

    /** Latest simulated round-trip latency in ms, or null when unknown. */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Integer latencyMs;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private int openIncidentCount;

    public NodeDTO() {
    }

    public NodeDTO(Long id, String name, String location, NodeStatus status, boolean deleted, List<IncidentDTO> incidents) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.status = status;
        this.deleted = deleted;
        this.incidents = incidents;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getLocation() {
        return location;
    }

    public NodeStatus getStatus() {
        return status;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public List<IncidentDTO> getIncidents() {
        return incidents;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setStatus(NodeStatus status) {
        this.status = status;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }

    public void setIncidents(List<IncidentDTO> incidents) {
        this.incidents = incidents;
    }

    public LocalDateTime getLastHeartbeatAt() {
        return lastHeartbeatAt;
    }

    public void setLastHeartbeatAt(LocalDateTime lastHeartbeatAt) {
        this.lastHeartbeatAt = lastHeartbeatAt;
    }

    public boolean isMonitored() {
        return monitored;
    }

    public void setMonitored(boolean monitored) {
        this.monitored = monitored;
    }

    public Integer getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(Integer latencyMs) {
        this.latencyMs = latencyMs;
    }

    public int getOpenIncidentCount() {
        return openIncidentCount;
    }

    public void setOpenIncidentCount(int openIncidentCount) {
        this.openIncidentCount = openIncidentCount;
    }
}
