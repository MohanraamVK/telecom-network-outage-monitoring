package com.telecom.network_monitor.dto;

import com.telecom.network_monitor.enums.NodeStatus;

import java.time.Instant;
import java.util.List;

/** Live health of one node, for the monitoring grid. */
public record NodeHealthDTO(
        Long id,
        String name,
        String location,
        NodeStatus status,
        boolean monitored,
        Instant lastHeartbeatAt,
        Integer latencyMs,
        List<Integer> latencyHistory
) {
}
