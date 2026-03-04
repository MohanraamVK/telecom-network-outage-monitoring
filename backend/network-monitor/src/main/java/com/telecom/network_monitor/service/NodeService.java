package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.NodeDTO;
import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NodeService {

    private final NodeRepository nodeRepository;

    public NodeService(NodeRepository nodeRepository) {
        this.nodeRepository = nodeRepository;
    }

    // CREATE NODE
    public NodeDTO createNode(NodeDTO dto) {
        Node node = convertToEntity(dto);
        Node saved = nodeRepository.save(node);
        return convertToDTO(saved);
    }

    // GET ALL NODES
    public List<NodeDTO> getAllNodes() {
        return nodeRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    // GET NODE BY ID
    public NodeDTO getNodeById(Long id) {
        Node node = nodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Node not found with id: " + id));
    return convertToDTO(node);
    }

    // UPDATE NODE
    public NodeDTO updateNode(Long id, NodeDTO dto) {
        Node node = nodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        node.setName(dto.getName());
        node.setLocation(dto.getLocation());
        node.setStatus(dto.getStatus());

        Node updated = nodeRepository.save(node);
        return convertToDTO(updated);
    }

    // ENTITY → DTO
    private NodeDTO convertToDTO(Node node) {
        List<IncidentDTO> incidentDTOs = null;

        if (node.getIncidents() != null) {
            incidentDTOs = node.getIncidents()
                    .stream()
                    .map(this::convertIncidentToDTO)
                    .collect(Collectors.toList());
        }

        return new NodeDTO(
                node.getId(),
                node.getName(),
                node.getLocation(),
                node.getStatus(),
                incidentDTOs
        );
    }

    private IncidentDTO convertIncidentToDTO(Incident incident) {
        return new IncidentDTO(
                incident.getId(),
                incident.getDescription(),
                incident.getSeverity(),
                incident.getStatus()
        );
    }

    // DTO → ENTITY
    private Node convertToEntity(NodeDTO dto) {
        Node node = new Node();
        node.setName(dto.getName());
        node.setLocation(dto.getLocation());
        node.setStatus(dto.getStatus());
        return node;
    }
}