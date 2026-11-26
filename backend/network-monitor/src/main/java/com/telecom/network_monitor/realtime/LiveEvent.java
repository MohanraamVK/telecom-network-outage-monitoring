package com.telecom.network_monitor.realtime;

import java.time.Instant;
import java.util.Map;

/**
 * Something the browser should know about right away, e.g. {@code incident.updated}.
 * Published as a Spring application event and pushed to clients after the
 * surrounding transaction commits, so clients never refetch uncommitted data.
 */
public record LiveEvent(String type, Map<String, Object> data, Instant timestamp) {

    public static final String NODE_CHANGED = "node.changed";
    public static final String INCIDENT_CHANGED = "incident.changed";
    public static final String MONITORING_SNAPSHOT = "monitoring.snapshot";

    public static LiveEvent of(String type, Map<String, Object> data) {
        return new LiveEvent(type, data, Instant.now());
    }
}
