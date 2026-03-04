package com.telecom.network_monitor.dto;

public class IncidentDTO {

    private Long id;
    private String description;
    private String severity;
    private String status;

    public IncidentDTO() {
    }

    public IncidentDTO(Long id, String description, String severity, String status) {
        this.id = id;
        this.description = description;
        this.severity = severity;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}