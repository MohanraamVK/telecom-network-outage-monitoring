package com.telecom.network_monitor.monitoring;

import com.telecom.network_monitor.dto.NodeHealthDTO;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

/** Read side of monitoring: current health of every node, and heartbeats from real agents. */
@Service
@Transactional(readOnly = true)
public class MonitoringQueryService {

    private final NodeRepository nodeRepository;
    private final HeartbeatRegistry registry;

    public MonitoringQueryService(NodeRepository nodeRepository, HeartbeatRegistry registry) {
        this.nodeRepository = nodeRepository;
        this.registry = registry;
    }

    public List<NodeHealthDTO> currentHealth() {
        return nodeRepository.findByDeletedFalseOrderByNameAsc().stream()
                .map(node -> new NodeHealthDTO(
                        node.getId(),
                        node.getName(),
                        node.getLocation(),
                        node.getStatus(),
                        node.isMonitored(),
                        registry.lastHeartbeat(node.getId()).orElseGet(() -> node.getLastHeartbeatAt() == null
                                ? null
                                : node.getLastHeartbeatAt().atZone(ZoneId.systemDefault()).toInstant()),
                        registry.lastLatency(node.getId()).orElse(null),
                        registry.latencyHistory(node.getId())))
                .toList();
    }

    public void recordHeartbeat(Long nodeId, int latencyMs) {
        nodeRepository.findById(nodeId)
                .filter(node -> !node.isDeleted())
                .orElseThrow(() -> new ResourceNotFoundException("Node not found with id: " + nodeId));
        registry.record(nodeId, Instant.now(), Math.max(0, latencyMs));
    }
}
