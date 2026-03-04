package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final NodeRepository nodeRepository;

    public IncidentService(IncidentRepository incidentRepository, NodeRepository nodeRepository) {
        this.incidentRepository = incidentRepository;
        this.nodeRepository = nodeRepository;
    }

    public IncidentDTO createIncident(Long nodeId, IncidentDTO dto) {

        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        Incident incident = new Incident();
        incident.setDescription(dto.getDescription());
        incident.setSeverity(dto.getSeverity());
        incident.setStatus(dto.getStatus());
        incident.setNode(node);

        Incident saved = incidentRepository.save(incident);

        return new IncidentDTO(
                saved.getId(),
                saved.getDescription(),
                saved.getSeverity(),
                saved.getStatus()
        );
    }

    // UPDATE INCIDENT STATUS
    public IncidentDTO updateIncidentStatus(Long incidentId, String newStatus) {

        Incident incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + incidentId));

        incident.setStatus(newStatus);

        Incident updated = incidentRepository.save(incident);

        return new IncidentDTO(
                updated.getId(),
                updated.getDescription(),
                updated.getSeverity(),
                updated.getStatus()
        );
    }

    // GET ALL INCIDENTS
    public List<IncidentDTO> getAllIncidents(String status) {
        List<Incident> incidents;
        if (status != null && !status.isEmpty()) {
            incidents = incidentRepository.findByStatus(status);
        } else {
            incidents = incidentRepository.findAll();
        }
        return incidents.stream()
                .map(incident -> new IncidentDTO(
                        incident.getId(),
                        incident.getDescription(),
                        incident.getSeverity(),
                        incident.getStatus()
                ))
                .toList();
    }

    public List<IncidentDTO> getIncidentsByNode(Long nodeId) {
        return incidentRepository.findByNodeId(nodeId)
                .stream()
                .map(i -> new IncidentDTO(
                        i.getId(),
                        i.getDescription(),
                        i.getSeverity(),
                        i.getStatus()
                ))
                .collect(Collectors.toList());
    }
}