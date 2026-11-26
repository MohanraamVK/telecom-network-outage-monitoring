package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.IncidentRequestDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.exception.BadRequestException;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final NodeRepository nodeRepository;
    private final Clock clock;

    @Autowired
    public IncidentService(IncidentRepository incidentRepository, NodeRepository nodeRepository) {
        this(incidentRepository, nodeRepository, Clock.systemDefaultZone());
    }

    /** Visible for tests, so resolution timestamps can be asserted deterministically. */
    IncidentService(IncidentRepository incidentRepository, NodeRepository nodeRepository, Clock clock) {
        this.incidentRepository = incidentRepository;
        this.nodeRepository = nodeRepository;
        this.clock = clock;
    }

    @Transactional
    public IncidentDTO createIncident(Long nodeId, IncidentRequestDTO dto) {
        Node node = nodeRepository.findById(nodeId)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Node not found or is deleted with id: " + nodeId));

        IncidentStatus status = parseIncidentStatus(dto.getStatus());

        Incident incident = new Incident();
        incident.setDescription(dto.getDescription().trim());
        incident.setSeverity(parseIncidentSeverity(dto.getSeverity()));
        incident.setStatus(status);
        incident.setNode(node);
        incident.setDeleted(false);

        if (status.isResolved()) {
            incident.setResolvedAt(now());
        }

        Incident saved = incidentRepository.save(incident);
        return convertToDTO(saved);
    }

    @Transactional
    public IncidentDTO updateIncidentStatus(Long incidentId, String newStatus) {
        Incident incident = incidentRepository.findById(incidentId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));

        IncidentStatus current = incident.getStatus();
        IncidentStatus next = parseIncidentStatus(newStatus);

        if (current != null && !current.canTransitionTo(next)) {
            throw new BadRequestException(
                    "Cannot change incident status from " + current + " to " + next
                            + (current == IncidentStatus.CLOSED
                            ? ". Closed incidents are final; raise a new incident instead."
                            : ". Allowed: " + current.allowedNextStatuses()));
        }

        if (next.isResolved() && incident.getResolvedAt() == null) {
            // First time the outage is over: start of the MTTR measurement window ends here.
            incident.setResolvedAt(now());
        } else if (!next.isResolved()) {
            // Re-opened: the outage is ongoing again.
            incident.setResolvedAt(null);
        }

        incident.setStatus(next);
        Incident updated = incidentRepository.save(incident);

        return convertToDTO(updated);
    }

    public List<IncidentDTO> getAllIncidents(IncidentStatus status) {
        List<Incident> incidents;

        if (status != null) {
            incidents = incidentRepository.findByStatusAndDeletedFalse(status);
        } else {
            incidents = incidentRepository.findByDeletedFalse();
        }

        return incidents.stream()
                .map(this::convertToDTO)
                .toList();
    }

    public Page<IncidentDTO> getAllIncidentsPaginated(IncidentStatus status, Pageable pageable) {
        Page<Incident> incidents;

        if (status != null) {
            incidents = incidentRepository.findByStatusAndDeletedFalse(status, pageable);
        } else {
            incidents = incidentRepository.findByDeletedFalse(pageable);
        }

        return incidents.map(this::convertToDTO);
    }

    public List<IncidentDTO> getDeletedIncidents() {
        return incidentRepository.findByDeletedTrue()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<IncidentDTO> getIncidentsByNode(Long nodeId) {
        return incidentRepository.findByNodeIdAndDeletedFalse(nodeId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional
    public String deleteIncident(Long incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));

        if (incident.isDeleted()) {
            return "Incident already deleted";
        }

        incident.setDeleted(true);
        incidentRepository.save(incident);

        return "Incident soft deleted successfully!";
    }

    @Transactional
    public String restoreIncident(Long incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));

        if (!incident.isDeleted()) {
            return "Incident is already active";
        }

        if (incident.getNode() != null && incident.getNode().isDeleted()) {
            throw new BadRequestException("Cannot restore incident because its node is deleted. Restore the node first.");
        }

        incident.setDeleted(false);
        incidentRepository.save(incident);

        return "Incident restored successfully!";
    }

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    private IncidentSeverity parseIncidentSeverity(String severity) {
        try {
            return IncidentSeverity.valueOf(severity.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BadRequestException("Invalid severity. Allowed values: " + Arrays.toString(IncidentSeverity.values()));
        }
    }

    private IncidentStatus parseIncidentStatus(String status) {
        try {
            return IncidentStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BadRequestException("Invalid status. Allowed values: " + Arrays.toString(IncidentStatus.values()));
        }
    }

    private IncidentDTO convertToDTO(Incident incident) {
        IncidentDTO dto = new IncidentDTO(
                incident.getId(),
                incident.getDescription(),
                incident.getSeverity(),
                incident.getStatus(),
                incident.getNode() != null ? incident.getNode().getId() : null,
                incident.getNode() != null ? incident.getNode().getName() : null,
                incident.isDeleted()
        );
        dto.setCreatedAt(incident.getCreatedAt());
        dto.setUpdatedAt(incident.getUpdatedAt());
        dto.setResolvedAt(incident.getResolvedAt());
        return dto;
    }
}
