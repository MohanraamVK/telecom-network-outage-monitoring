package com.telecom.network_monitor.service;

import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final NodeRepository nodeRepository;

    public IncidentService(IncidentRepository incidentRepository,
                           NodeRepository nodeRepository) {
        this.incidentRepository = incidentRepository;
        this.nodeRepository = nodeRepository;
    }

    public Incident createIncident(Long nodeId, Incident incident) {
        Node node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        incident.setNode(node);
        return incidentRepository.save(incident);
    }

    public List<Incident> getIncidentsByNode(Long nodeId) {
        return incidentRepository.findByNodeId(nodeId);
    }
}