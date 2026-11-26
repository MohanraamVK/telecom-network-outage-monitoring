package com.telecom.network_monitor.entity;

import com.telecom.network_monitor.enums.IncidentEventType;
import com.telecom.network_monitor.enums.IncidentStatus;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/** One immutable entry in an incident's timeline (audit trail). */
@Entity
@Table(name = "incident_events")
public class IncidentEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private IncidentEventType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 32)
    private IncidentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", length = 32)
    private IncidentStatus toStatus;

    @Column(length = 1000)
    private String message;

    @Column(nullable = false, length = 100)
    private String actor;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected IncidentEvent() {
    }

    public IncidentEvent(Incident incident, IncidentEventType type, IncidentStatus fromStatus,
                         IncidentStatus toStatus, String message, String actor, LocalDateTime createdAt) {
        this.incident = incident;
        this.type = type;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.message = message;
        this.actor = actor;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Incident getIncident() {
        return incident;
    }

    public IncidentEventType getType() {
        return type;
    }

    public IncidentStatus getFromStatus() {
        return fromStatus;
    }

    public IncidentStatus getToStatus() {
        return toStatus;
    }

    public String getMessage() {
        return message;
    }

    public String getActor() {
        return actor;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
