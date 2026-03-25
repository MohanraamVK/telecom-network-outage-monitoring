package com.telecom.network_monitor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;

public class IncidentDTO {

    private Long id;
    private String description;
    private IncidentSeverity severity;
    private IncidentStatus status;

    private Long nodeId;
    private String nodeName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private boolean deleted = false;

    public IncidentDTO() {
    }

    public IncidentDTO(Long id,
                       String description,
                       IncidentSeverity severity,
                       IncidentStatus status,
                       Long nodeId,
                       String nodeName,
                       boolean deleted) {
        this.id = id;
        this.description = description;
        this.severity = severity;
        this.status = status;
        this.nodeId = nodeId;
        this.nodeName = nodeName;
        this.deleted = deleted;
    }

    public Long getId() {
        return id;
    }

    public String getDescription() {
        return description;
    }

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public Long getNodeId() {
        return nodeId;
    }

    public String getNodeName() {
        return nodeName;
    }

    public boolean isDeleted() {
        return deleted;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setSeverity(IncidentSeverity severity) {
        this.severity = severity;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public void setNodeName(String nodeName) {
        this.nodeName = nodeName;
    }

    public void setDeleted(boolean deleted) {
        this.deleted = deleted;
    }
}