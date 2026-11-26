package com.telecom.network_monitor.monitoring;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.realtime.LiveEventPublisher;
import com.telecom.network_monitor.repository.NodeRepository;
import com.telecom.network_monitor.service.IncidentService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

/**
 * State changes made by the outage detector. Each method runs in its own transaction
 * and re-reads the node, so a decision based on slightly stale data is re-checked.
 */
@Service
public class OutageService {

    private final NodeRepository nodeRepository;
    private final IncidentService incidentService;
    private final LiveEventPublisher liveEvents;

    public OutageService(NodeRepository nodeRepository, IncidentService incidentService, LiveEventPublisher liveEvents) {
        this.nodeRepository = nodeRepository;
        this.incidentService = incidentService;
        this.liveEvents = liveEvents;
    }

    /** ACTIVE node went silent: mark it DOWN and open an incident. */
    @Transactional
    public boolean markDown(Long nodeId, Duration silentFor) {
        Node node = nodeRepository.findById(nodeId).orElse(null);
        if (node == null || node.isDeleted() || !node.isMonitored() || node.getStatus() != NodeStatus.ACTIVE) {
            return false;
        }

        node.setStatus(NodeStatus.DOWN);
        nodeRepository.save(node);

        String description = "Heartbeat lost: " + node.getName() + " has not responded for "
                + silentFor.toSeconds() + "s";
        incidentService.openAutoIncident(node, description, IncidentSeverity.HIGH);
        liveEvents.nodeChanged(nodeId, "down");
        return true;
    }

    /**
     * DOWN node is heartbeating again. Only nodes the detector itself took down are
     * recovered; a node an operator set to DOWN by hand stays DOWN.
     */
    @Transactional
    public boolean markRecovered(Long nodeId) {
        Node node = nodeRepository.findById(nodeId).orElse(null);
        if (node == null || node.isDeleted() || node.getStatus() != NodeStatus.DOWN) {
            return false;
        }

        int resolved = incidentService.autoResolveForNode(nodeId,
                "Heartbeat restored: " + node.getName() + " is responding again");
        if (resolved == 0) {
            return false;
        }

        node.setStatus(NodeStatus.ACTIVE);
        nodeRepository.save(node);
        liveEvents.nodeChanged(nodeId, "recovered");
        return true;
    }

    @Transactional
    public void persistHeartbeats(Map<Long, Instant> heartbeats) {
        heartbeats.forEach((nodeId, at) ->
                nodeRepository.updateLastHeartbeat(nodeId, LocalDateTime.ofInstant(at, ZoneId.systemDefault())));
    }
}
