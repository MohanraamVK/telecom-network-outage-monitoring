package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.IncidentRequestDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final NodeRepository nodeRepository;

    public IncidentService(IncidentRepository incidentRepository, NodeRepository nodeRepository) {
        this.incidentRepository = incidentRepository;
        this.nodeRepository = nodeRepository;
    }

    public IncidentDTO createIncident(Long nodeId, IncidentRequestDTO dto) {
        Node node = nodeRepository.findById(nodeId)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Node not found or is deleted with id: " + nodeId));

        Incident incident = new Incident();
        incident.setDescription(dto.getDescription());
        incident.setSeverity(parseIncidentSeverity(dto.getSeverity()));
        incident.setStatus(parseIncidentStatus(dto.getStatus()));
        incident.setNode(node);
        incident.setDeleted(false);

        Incident saved = incidentRepository.save(incident);
        return convertToDTO(saved);
    }

    public IncidentDTO updateIncidentStatus(Long incidentId, String newStatus) {
        Incident incident = incidentRepository.findById(incidentId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));

        incident.setStatus(parseIncidentStatus(newStatus));
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

    public String restoreIncident(Long incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + incidentId));

        if (!incident.isDeleted()) {
            return "Incident is already active";
        }

        if (incident.getNode() != null && incident.getNode().isDeleted()) {
            return "Cannot restore incident because parent node is still deleted";
        }

        incident.setDeleted(false);
        incidentRepository.save(incident);

        return "Incident restored successfully!";
    }

    private IncidentSeverity parseIncidentSeverity(String severity) {
        try {
            return IncidentSeverity.valueOf(severity.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid severity. Allowed values: LOW, MEDIUM, HIGH, CRITICAL");
        }
    }

    private IncidentStatus parseIncidentStatus(String status) {
        try {
            return IncidentStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("Invalid status. Allowed values: OPEN, IN_PROGRESS, RESOLVED, CLOSED");
        }
    }

    private IncidentDTO convertToDTO(Incident incident) {
        return new IncidentDTO(
                incident.getId(),
                incident.getDescription(),
                incident.getSeverity(),
                incident.getStatus(),
                incident.isDeleted()
        );
    }
}