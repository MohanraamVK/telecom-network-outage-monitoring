package com.telecom.network_monitor.dto;

public class IncidentStatusUpdateDTO {

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