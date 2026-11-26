package com.telecom.network_monitor.monitoring;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

/**
 * Settings under {@code app.monitor.*}.
 *
 * @param enabled             run the outage detector at all
 * @param interval            how often heartbeats are simulated and checked
 * @param heartbeatTimeout    a node with no heartbeat for this long is considered DOWN
 * @param simulatorEnabled    generate fake heartbeats (demo); turn off when real agents report
 * @param failureProbability  chance per tick that a healthy simulated node starts an outage
 * @param minOutage           shortest simulated outage
 * @param maxOutage           longest simulated outage
 */
@ConfigurationProperties(prefix = "app.monitor")
public record MonitoringProperties(
        boolean enabled,
        Duration interval,
        Duration heartbeatTimeout,
        boolean simulatorEnabled,
        double failureProbability,
        Duration minOutage,
        Duration maxOutage
) {

    public MonitoringProperties {
        if (interval == null) interval = Duration.ofSeconds(10);
        if (heartbeatTimeout == null) heartbeatTimeout = Duration.ofSeconds(30);
        if (minOutage == null) minOutage = Duration.ofMinutes(1);
        if (maxOutage == null) maxOutage = Duration.ofMinutes(4);
        if (maxOutage.compareTo(minOutage) < 0) maxOutage = minOutage;
    }
}
