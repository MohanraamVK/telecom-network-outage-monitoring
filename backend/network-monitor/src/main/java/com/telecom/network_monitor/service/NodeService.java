package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.NodeDTO;
import com.telecom.network_monitor.dto.NodeRequestDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.exception.BadRequestException;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class NodeService {

    private final NodeRepository nodeRepository;

    public NodeService(NodeRepository nodeRepository) {
        this.nodeRepository = nodeRepository;
    }

    @Transactional
    public NodeDTO createNode(NodeRequestDTO dto) {
        Node node = new Node();
        node.setName(dto.getName().trim());
        node.setLocation(dto.getLocation().trim());
        node.setStatus(parseNodeStatus(dto.getStatus()));
        node.setDeleted(false);

        Node saved = nodeRepository.save(node);
        return convertToDTO(saved);
    }

    public List<NodeDTO> getAllNodes() {
        return nodeRepository.findByDeletedFalse()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Page<NodeDTO> getAllNodesPaginated(Pageable pageable) {
        return nodeRepository.findByDeletedFalse(pageable)
                .map(this::convertToDTO);
    }

    public List<NodeDTO> getDeletedNodes() {
        return nodeRepository.findByDeletedTrue()
                .stream()
                .map(this::convertToDTOWithAllIncidents)
                .collect(Collectors.toList());
    }

    public NodeDTO getNodeById(Long id) {
        Node node = nodeRepository.findById(id)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Node not found with id: " + id));

        return convertToDTO(node);
    }

    @Transactional
    public NodeDTO updateNode(Long id, NodeRequestDTO dto) {
        Node node = nodeRepository.findById(id)
                .filter(n -> !n.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Node not found with id: " + id));

        node.setName(dto.getName().trim());
        node.setLocation(dto.getLocation().trim());
        node.setStatus(parseNodeStatus(dto.getStatus()));

        Node updated = nodeRepository.save(node);
        return convertToDTO(updated);
    }

    @Transactional
    public String deleteNode(Long id) {
        Node node = nodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found with id: " + id));

        if (node.isDeleted()) {
            return "Node already deleted";
        }

        node.setDeleted(true);

        if (node.getIncidents() != null) {
            node.getIncidents().forEach(incident -> incident.setDeleted(true));
        }

        nodeRepository.save(node);
        return "Node and its incidents soft deleted successfully!";
    }

    @Transactional
    public String restoreNode(Long id) {
        Node node = nodeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found with id: " + id));

        if (!node.isDeleted()) {
            return "Node is already active";
        }

        node.setDeleted(false);

        if (node.getIncidents() != null) {
            node.getIncidents().forEach(incident -> incident.setDeleted(false));
        }

        nodeRepository.save(node);
        return "Node restored successfully!";
    }

    private NodeStatus parseNodeStatus(String status) {
        try {
            return NodeStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BadRequestException("Invalid node status. Allowed values: " + Arrays.toString(NodeStatus.values()));
        }
    }

    private NodeDTO convertToDTO(Node node) {
        List<IncidentDTO> incidentDTOs = null;

        if (node.getIncidents() != null) {
            incidentDTOs = node.getIncidents()
                    .stream()
                    .filter(incident -> !incident.isDeleted())
                    .map(this::convertIncidentToDTO)
                    .collect(Collectors.toList());
        }

        return new NodeDTO(
                node.getId(),
                node.getName(),
                node.getLocation(),
                node.getStatus(),
                node.isDeleted(),
                incidentDTOs
        );
    }

    private NodeDTO convertToDTOWithAllIncidents(Node node) {
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
                node.isDeleted(),
                incidentDTOs
        );
    }

    private IncidentDTO convertIncidentToDTO(Incident incident) {
        return new IncidentDTO(
                incident.getId(),
                incident.getDescription(),
                incident.getSeverity(),
                incident.getStatus(),
                null, null, incident.isDeleted()
        );
    }
}