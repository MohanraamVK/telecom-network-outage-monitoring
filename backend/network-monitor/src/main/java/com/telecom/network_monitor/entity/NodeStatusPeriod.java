package com.telecom.network_monitor.entity;

import com.telecom.network_monitor.enums.NodeStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;

/** A stretch of time a node spent DOWN or in MAINTENANCE. Open while {@code endedAt} is null. */
@Entity
@Table(name = "node_status_periods")
public class NodeStatusPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "node_id", nullable = false)
    private Node node;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private NodeStatus status;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "ended_at")
    private LocalDateTime endedAt;

    /** True when the outage detector opened it (as opposed to an operator). */
    @Column(name = "auto_detected", nullable = false)
    @ColumnDefault("false")
    private boolean autoDetected;

    protected NodeStatusPeriod() {
    }

    public NodeStatusPeriod(Node node, NodeStatus status, LocalDateTime startedAt, boolean autoDetected) {
        this.node = node;
        this.status = status;
        this.startedAt = startedAt;
        this.autoDetected = autoDetected;
    }

    public Long getId() {
        return id;
    }

    public Node getNode() {
        return node;
    }

    public NodeStatus getStatus() {
        return status;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public LocalDateTime getEndedAt() {
        return endedAt;
    }

    public boolean isAutoDetected() {
        return autoDetected;
    }

    public void setEndedAt(LocalDateTime endedAt) {
        this.endedAt = endedAt;
    }

    public boolean isOpen() {
        return endedAt == null;
    }
}
