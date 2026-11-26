package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.NodeDTO;
import com.telecom.network_monitor.dto.NodeRequestDTO;
import com.telecom.network_monitor.dto.PageResponse;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.exception.BadRequestException;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.monitoring.HeartbeatRegistry;
import com.telecom.network_monitor.realtime.LiveEventPublisher;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import com.telecom.network_monitor.search.NodeSearchCriteria;
import com.telecom.network_monitor.search.SortSupport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class NodeService {

    private static final Set<String> SORTABLE = Set.of("id", "name", "location", "status", "lastHeartbeatAt");

    private final NodeRepository nodeRepository;
    private final IncidentRepository incidentRepository;
    private final HeartbeatRegistry heartbeats;
    private final LiveEventPublisher liveEvents;

    @Autowired
    public NodeService(NodeRepository nodeRepository,
                       IncidentRepository incidentRepository,
                       HeartbeatRegistry heartbeats,
                       LiveEventPublisher liveEvents) {
        this.nodeRepository = nodeRepository;
        this.incidentRepository = incidentRepository;
        this.heartbeats = heartbeats;
        this.liveEvents = liveEvents;
    }

    // ------------------------------------------------------------------ commands

    @Transactional
    public NodeDTO createNode(NodeRequestDTO dto) {
        Node node = new Node();
        node.setName(dto.getName().trim());
        node.setLocation(dto.getLocation().trim());
        node.setStatus(parseNodeStatus(dto.getStatus()));
        node.setDeleted(false);

        Node saved = nodeRepository.save(node);
        liveEvents.nodeChanged(saved.getId(), "created");
        return convertToDTO(saved);
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
        liveEvents.nodeChanged(updated.getId(), "updated");
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
        heartbeats.forget(id);
        liveEvents.nodeChanged(id, "deleted");
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
        liveEvents.nodeChanged(id, "restored");
        return "Node restored successfully!";
    }

    // ------------------------------------------------------------------ queries

    /** Server-side search, filter, sort and pagination. */
    public PageResponse<NodeDTO> search(NodeSearchCriteria criteria, int page, int size, String sort) {
        Pageable pageable = SortSupport.pageable(page, size, sort, SORTABLE, "name,asc");
        Page<Node> nodes = nodeRepository.findAll(criteria.toSpecification(), pageable);

        Map<Long, Integer> openCounts = openIncidentCounts(nodes.getContent().stream().map(Node::getId).toList());
        return PageResponse.of(nodes.map(node -> toSummaryDTO(node, openCounts.getOrDefault(node.getId(), 0))));
    }

    /** Compact list of active nodes (id, name, status) for dropdowns. */
    public List<NodeDTO> getNodeOptions() {
        return nodeRepository.findByDeletedFalseOrderByNameAsc().stream()
                .map(node -> toSummaryDTO(node, 0))
                .toList();
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

    // ------------------------------------------------------------------ helpers

    private Map<Long, Integer> openIncidentCounts(Collection<Long> nodeIds) {
        Map<Long, Integer> counts = new HashMap<>();
        if (nodeIds.isEmpty()) {
            return counts;
        }
        for (Object[] row : incidentRepository.countOpenByNodeIds(nodeIds, IncidentService.UNRESOLVED)) {
            counts.put((Long) row[0], ((Number) row[1]).intValue());
        }
        return counts;
    }

    private NodeStatus parseNodeStatus(String status) {
        try {
            return NodeStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new BadRequestException("Invalid node status. Allowed values: " + Arrays.toString(NodeStatus.values()));
        }
    }

    /** Node without its incident list, plus live health data. */
    private NodeDTO toSummaryDTO(Node node, int openIncidentCount) {
        NodeDTO dto = new NodeDTO(node.getId(), node.getName(), node.getLocation(), node.getStatus(),
                node.isDeleted(), null);
        applyHealth(node, dto);
        dto.setOpenIncidentCount(openIncidentCount);
        return dto;
    }

    private void applyHealth(Node node, NodeDTO dto) {
        dto.setMonitored(node.isMonitored());
        dto.setLastHeartbeatAt(heartbeats.lastHeartbeat(node.getId())
                .map(instant -> LocalDateTime.ofInstant(instant, ZoneId.systemDefault()))
                .orElse(node.getLastHeartbeatAt()));
        dto.setLatencyMs(heartbeats.lastLatency(node.getId()).orElse(null));
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

        NodeDTO dto = new NodeDTO(
                node.getId(),
                node.getName(),
                node.getLocation(),
                node.getStatus(),
                node.isDeleted(),
                incidentDTOs
        );
        applyHealth(node, dto);
        if (incidentDTOs != null) {
            dto.setOpenIncidentCount((int) incidentDTOs.stream()
                    .filter(i -> i.getStatus() != null && !i.getStatus().isResolved())
                    .count());
        }
        return dto;
    }

    private NodeDTO convertToDTOWithAllIncidents(Node node) {
        List<IncidentDTO> incidentDTOs = null;

        if (node.getIncidents() != null) {
            incidentDTOs = node.getIncidents()
                    .stream()
                    .map(this::convertIncidentToDTO)
                    .collect(Collectors.toList());
        }

        NodeDTO dto = new NodeDTO(
                node.getId(),
                node.getName(),
                node.getLocation(),
                node.getStatus(),
                node.isDeleted(),
                incidentDTOs
        );
        applyHealth(node, dto);
        return dto;
    }

    private IncidentDTO convertIncidentToDTO(Incident incident) {
        IncidentDTO dto = new IncidentDTO(
                incident.getId(),
                incident.getDescription(),
                incident.getSeverity(),
                incident.getStatus(),
                null, null, incident.isDeleted()
        );
        dto.setCreatedAt(incident.getCreatedAt());
        dto.setResolvedAt(incident.getResolvedAt());
        dto.setAutoGenerated(incident.isAutoGenerated());
        return dto;
    }
}
