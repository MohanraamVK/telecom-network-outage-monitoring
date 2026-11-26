package com.telecom.network_monitor.analytics;

import com.telecom.network_monitor.entity.NodeStatusPeriod;
import com.telecom.network_monitor.enums.NodeStatus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collection;

/**
 * Pure uptime arithmetic. Planned maintenance is excluded from the measured time,
 * the way SLAs usually treat it: uptime = 1 - down / (window - maintenance).
 */
public final class UptimeCalculator {

    private UptimeCalculator() {
    }

    /** Seconds of overlap between [start, end) and [from, to); an open period ends at {@code now}. */
    public static long overlapSeconds(LocalDateTime start, LocalDateTime end, LocalDateTime from, LocalDateTime to) {
        LocalDateTime s = start.isAfter(from) ? start : from;
        LocalDateTime e = end.isBefore(to) ? end : to;
        return e.isAfter(s) ? Duration.between(s, e).toSeconds() : 0;
    }

    public static long statusSeconds(Collection<NodeStatusPeriod> periods, NodeStatus status,
                                     LocalDateTime from, LocalDateTime to, LocalDateTime now) {
        long total = 0;
        for (NodeStatusPeriod p : periods) {
            if (p.getStatus() == status) {
                total += overlapSeconds(p.getStartedAt(), p.getEndedAt() == null ? now : p.getEndedAt(), from, to);
            }
        }
        return total;
    }

    /**
     * @param existsFrom when the node was created (null = before the window)
     * @return uptime in percent with three decimals, 100 when nothing was measurable
     */
    public static double uptimePercent(Collection<NodeStatusPeriod> periods, LocalDateTime existsFrom,
                                       LocalDateTime from, LocalDateTime to, LocalDateTime now) {
        LocalDateTime start = existsFrom != null && existsFrom.isAfter(from) ? existsFrom : from;
        long window = to.isAfter(start) ? Duration.between(start, to).toSeconds() : 0;
        long measured = window - statusSeconds(periods, NodeStatus.MAINTENANCE, start, to, now);
        if (measured <= 0) {
            return 100.0;
        }
        long down = Math.min(measured, statusSeconds(periods, NodeStatus.DOWN, start, to, now));
        return round3(100.0 * (measured - down) / measured);
    }

    static double round3(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }
}
