package com.telecom.network_monitor.monitoring;

import com.telecom.network_monitor.dto.NodeHealthDTO;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.realtime.LiveEvent;
import com.telecom.network_monitor.realtime.LiveEventPublisher;
import com.telecom.network_monitor.repository.NodeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Runs every {@code app.monitor.interval}:
 * <ol>
 *   <li><b>Simulator</b> (demo): emits a heartbeat with a realistic latency for each node,
 *       and now and then lets a node go silent for a few minutes.</li>
 *   <li><b>Detector</b>: an ACTIVE node silent for longer than the timeout is marked DOWN
 *       with an automatic incident; when its heartbeat returns it is recovered and the
 *       incident auto-resolved.</li>
 *   <li>Pushes a monitoring snapshot to connected browsers.</li>
 * </ol>
 * Real devices could report through {@code POST /api/nodes/{id}/heartbeat} instead of the simulator.
 */
@Component
@ConditionalOnProperty(prefix = "app.monitor", name = "enabled", havingValue = "true", matchIfMissing = true)
public class NodeMonitor {

    private static final Logger log = LoggerFactory.getLogger(NodeMonitor.class);

    /** Never let the simulator take down more than this many nodes at once. */
    static final int MAX_SIMULTANEOUS_OUTAGES = 2;

    /** Heartbeat timestamps are written to the database at most this often per node. */
    static final Duration PERSIST_EVERY = Duration.ofSeconds(60);

    private final NodeRepository nodeRepository;
    private final OutageService outageService;
    private final HeartbeatRegistry registry;
    private final MonitoringProperties properties;
    private final LiveEventPublisher liveEvents;
    private final Clock clock;
    private final Random random;

    private final Map<Long, Instant> simulatedOutageUntil = new ConcurrentHashMap<>();
    private final Map<Long, Instant> lastPersisted = new ConcurrentHashMap<>();
    private final Instant startedAt;

    @Autowired
    public NodeMonitor(NodeRepository nodeRepository, OutageService outageService, HeartbeatRegistry registry,
                       MonitoringProperties properties, LiveEventPublisher liveEvents) {
        this(nodeRepository, outageService, registry, properties, liveEvents, Clock.systemUTC(), new Random());
    }

    NodeMonitor(NodeRepository nodeRepository, OutageService outageService, HeartbeatRegistry registry,
                MonitoringProperties properties, LiveEventPublisher liveEvents, Clock clock, Random random) {
        this.nodeRepository = nodeRepository;
        this.outageService = outageService;
        this.registry = registry;
        this.properties = properties;
        this.liveEvents = liveEvents;
        this.clock = clock;
        this.random = random;
        this.startedAt = clock.instant();
    }

    @Scheduled(fixedDelayString = "${app.monitor.interval:10s}", initialDelayString = "${app.monitor.interval:10s}")
    public void tick() {
        try {
            runCycle();
        } catch (Exception ex) {
            // A database hiccup must not kill the scheduler thread
            log.warn("Monitoring cycle failed: {}", ex.getMessage());
        }
    }

    /** One monitoring cycle. Package-private for tests. */
    void runCycle() {
        Instant now = clock.instant();
        List<Node> nodes = nodeRepository.findByDeletedFalseAndMonitoredTrue();

        if (properties.simulatorEnabled()) {
            for (Node node : nodes) {
                simulate(node, now);
            }
        }

        Map<Long, NodeStatus> statusAfter = new HashMap<>();
        for (Node node : nodes) {
            statusAfter.put(node.getId(), evaluate(node, now));
        }

        persistHeartbeats(nodes, now);
        liveEvents.publish(LiveEvent.of(LiveEvent.MONITORING_SNAPSHOT,
                Map.of("nodes", snapshot(nodes, statusAfter))));
    }

    /** Records a heartbeat reported by a real device or agent. */
    public void reportHeartbeat(Long nodeId, int latencyMs) {
        registry.record(nodeId, clock.instant(), latencyMs);
    }

    // ------------------------------------------------------------------ simulator

    void simulate(Node node, Instant now) {
        Instant outageUntil = simulatedOutageUntil.get(node.getId());
        if (outageUntil != null) {
            if (now.isBefore(outageUntil)) {
                return; // still silent
            }
            simulatedOutageUntil.remove(node.getId());
        } else if (node.getStatus() == NodeStatus.ACTIVE
                && simulatedOutageUntil.size() < MAX_SIMULTANEOUS_OUTAGES
                && random.nextDouble() < properties.failureProbability()) {
            simulatedOutageUntil.put(node.getId(), now.plus(randomOutageLength()));
            return;
        }

        registry.record(node.getId(), now, simulatedLatency(node.getId()));
    }

    private Duration randomOutageLength() {
        long min = properties.minOutage().toMillis();
        long max = properties.maxOutage().toMillis();
        return Duration.ofMillis(min + (long) (random.nextDouble() * (max - min)));
    }

    /** Stable per-node baseline (8-45 ms) with jitter and the occasional spike. */
    int simulatedLatency(Long nodeId) {
        int baseline = 8 + (int) (Math.abs(nodeId * 2654435761L) % 38);
        int jitter = (int) Math.round(random.nextGaussian() * baseline * 0.15);
        int spike = random.nextDouble() < 0.05 ? 40 + random.nextInt(80) : 0;
        return Math.max(1, baseline + jitter + spike);
    }

    // ------------------------------------------------------------------ detector

    NodeStatus evaluate(Node node, Instant now) {
        NodeStatus status = node.getStatus();
        if (status == NodeStatus.MAINTENANCE) {
            return status; // planned work: never alert
        }

        Instant last = registry.lastHeartbeat(node.getId()).orElse(null);
        if (last == null) {
            return status; // never reported since start-up: unknown, not down
        }

        Duration silentFor = Duration.between(last, now);
        boolean stale = silentFor.compareTo(properties.heartbeatTimeout()) > 0;
        boolean pastGracePeriod = now.isAfter(startedAt.plus(properties.heartbeatTimeout()));

        if (status == NodeStatus.ACTIVE && stale && pastGracePeriod) {
            if (outageService.markDown(node.getId(), silentFor)) {
                log.info("Node {} ({}) marked DOWN after {}s without heartbeat", node.getId(), node.getName(),
                        silentFor.toSeconds());
                return NodeStatus.DOWN;
            }
        } else if (status == NodeStatus.DOWN && !stale) {
            if (outageService.markRecovered(node.getId())) {
                log.info("Node {} ({}) recovered", node.getId(), node.getName());
                return NodeStatus.ACTIVE;
            }
        }
        return status;
    }

    private void persistHeartbeats(List<Node> nodes, Instant now) {
        Map<Long, Instant> due = new HashMap<>();
        for (Node node : nodes) {
            registry.lastHeartbeat(node.getId()).ifPresent(last -> {
                Instant persisted = lastPersisted.get(node.getId());
                if (persisted == null || Duration.between(persisted, now).compareTo(PERSIST_EVERY) >= 0) {
                    due.put(node.getId(), last);
                }
            });
        }
        if (!due.isEmpty()) {
            outageService.persistHeartbeats(due);
            due.keySet().forEach(id -> lastPersisted.put(id, now));
        }
    }

    // ------------------------------------------------------------------ snapshot

    private List<NodeHealthDTO> snapshot(List<Node> nodes, Map<Long, NodeStatus> statusAfter) {
        List<NodeHealthDTO> result = new ArrayList<>(nodes.size());
        for (Node node : nodes) {
            result.add(new NodeHealthDTO(
                    node.getId(),
                    node.getName(),
                    node.getLocation(),
                    statusAfter.getOrDefault(node.getId(), node.getStatus()),
                    node.isMonitored(),
                    registry.lastHeartbeat(node.getId()).orElse(null),
                    registry.lastLatency(node.getId()).orElse(null),
                    registry.latencyHistory(node.getId())));
        }
        return result;
    }

    boolean isInSimulatedOutage(Long nodeId) {
        return simulatedOutageUntil.containsKey(nodeId);
    }
}
