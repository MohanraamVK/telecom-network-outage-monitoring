package com.telecom.network_monitor.dto;

import java.util.List;

public class NodeDTO {

    private Long id;
    private String name;
    private String location;
    private String status;
    private List<IncidentDTO> incidents;

    public NodeDTO() {
    }

    public NodeDTO(Long id, String name, String location, String status, List<IncidentDTO> incidents) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.status = status;
        this.incidents = incidents;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<IncidentDTO> getIncidents() {
        return incidents;
    }

    public void setIncidents(List<IncidentDTO> incidents) {
        this.incidents = incidents;
    }
}