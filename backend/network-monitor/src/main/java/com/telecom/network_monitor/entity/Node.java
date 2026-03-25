package com.telecom.network_monitor.entity;

import com.telecom.network_monitor.enums.NodeStatus;
import jakarta.persistence.*;

import java.util.List;

@Entity
@Table(name = "nodes")
public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;
    private String location;

    @Enumerated(EnumType.STRING)
    private NodeStatus status;

    private boolean deleted = false;

    @OneToMany(mappedBy = "node", fetch = FetchType.LAZY)
    private List<Incident> incidents;

    public Node() {
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

    public List<Incident> getIncidents() {
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

    public void setIncidents(List<Incident> incidents) {
        this.incidents = incidents;
    }
}