package com.telecom.network_monitor.entity;

import com.telecom.network_monitor.enums.NodeStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
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

    /** Last heartbeat persisted to the database (written at most about once a minute). */
    @Column(name = "last_heartbeat_at")
    private LocalDateTime lastHeartbeatAt;

    /** Whether the outage detector watches this node. */
    // Database defaults matter when Hibernate adds these columns to existing rows
    // (TiDB deployments, where Flyway is disabled): existing nodes stay monitored.
    @Column(nullable = false)
    @ColumnDefault("true")
    private boolean monitored = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Version
    @Column(nullable = false)
    @ColumnDefault("0")
    private Long version;

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

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
