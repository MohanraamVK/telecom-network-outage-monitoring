package com.telecom.network_monitor.monitoring;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory record of the latest heartbeat and recent latency samples per node.
 *
 * Heartbeats arrive every few seconds, so keeping them in memory (and only
 * persisting the timestamp about once a minute) keeps database writes, and
 * therefore cost on a serverless database, low.
 */
@Component
public class HeartbeatRegistry {

    static final int HISTORY_SIZE = 30;

    private final Map<Long, NodeHealth> health = new ConcurrentHashMap<>();

    public void record(Long nodeId, Instant at, int latencyMs) {
        health.computeIfAbsent(nodeId, id -> new NodeHealth()).record(at, latencyMs);
    }

    public Optional<Instant> lastHeartbeat(Long nodeId) {
        NodeHealth h = health.get(nodeId);
        return h == null ? Optional.empty() : Optional.ofNullable(h.lastHeartbeat);
    }

    public Optional<Integer> lastLatency(Long nodeId) {
        NodeHealth h = health.get(nodeId);
        return h == null ? Optional.empty() : Optional.ofNullable(h.lastLatencyMs);
    }

    public List<Integer> latencyHistory(Long nodeId) {
        NodeHealth h = health.get(nodeId);
        return h == null ? List.of() : h.history();
    }

    public void forget(Long nodeId) {
        health.remove(nodeId);
    }

    private static final class NodeHealth {
        private volatile Instant lastHeartbeat;
        private volatile Integer lastLatencyMs;
        private final Deque<Integer> samples = new ArrayDeque<>(HISTORY_SIZE);

        synchronized void record(Instant at, int latencyMs) {
            lastHeartbeat = at;
            lastLatencyMs = latencyMs;
            if (samples.size() == HISTORY_SIZE) {
                samples.removeFirst();
            }
            samples.addLast(latencyMs);
        }

        synchronized List<Integer> history() {
            return List.copyOf(samples);
        }
    }
}
