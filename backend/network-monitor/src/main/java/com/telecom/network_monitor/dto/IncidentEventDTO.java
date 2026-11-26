package com.telecom.network_monitor.dto;

import com.telecom.network_monitor.entity.IncidentEvent;
import com.telecom.network_monitor.enums.IncidentEventType;
import com.telecom.network_monitor.enums.IncidentStatus;

import java.time.LocalDateTime;

/** Timeline entry as returned by the API. Incident and node fields support the activity feed. */
public record IncidentEventDTO(
        Long id,
        Long incidentId,
        String incidentDescription,
        Long nodeId,
        String nodeName,
        IncidentEventType type,
        IncidentStatus fromStatus,
        IncidentStatus toStatus,
        String message,
        String actor,
        LocalDateTime createdAt
) {

    public static IncidentEventDTO from(IncidentEvent event) {
        var incident = event.getIncident();
        var node = incident != null ? incident.getNode() : null;
        return new IncidentEventDTO(
                event.getId(),
                incident != null ? incident.getId() : null,
                incident != null ? incident.getDescription() : null,
                node != null ? node.getId() : null,
                node != null ? node.getName() : null,
                event.getType(),
                event.getFromStatus(),
                event.getToStatus(),
                event.getMessage(),
                event.getActor(),
                event.getCreatedAt()
        );
    }
}
