package com.telecom.network_monitor.dto;

import jakarta.validation.constraints.NotBlank;

public class IncidentStatusUpdateDTO {

    @NotBlank(message = "Status is required")
    private String status;

    public IncidentStatusUpdateDTO() {
    }

    public IncidentStatusUpdateDTO(String status) {
        this.status = status;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}