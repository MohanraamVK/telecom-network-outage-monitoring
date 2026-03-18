package com.telecom.network_monitor.dto;

import jakarta.validation.constraints.NotBlank;

public class IncidentRequestDTO {

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Severity is required")
    private String severity;

    @NotBlank(message = "Status is required")
    private String status;

    public IncidentRequestDTO() {
    }

    public IncidentRequestDTO(String description, String severity, String status) {
        this.description = description;
        this.severity = severity;
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public String getSeverity() {
        return severity;
    }

    public String getStatus() {
        return status;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}