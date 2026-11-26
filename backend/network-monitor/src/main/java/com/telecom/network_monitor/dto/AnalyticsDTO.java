package com.telecom.network_monitor.dto;

import com.telecom.network_monitor.enums.NodeStatus;

import java.time.LocalDate;
import java.util.List;

/** Everything the analytics page shows for one time range. */
public record AnalyticsDTO(
        int days,
        double slaTargetPercent,
        double networkAvailabilityPercent,
        long downtimeMinutes,
        int incidentsOpened,
        int incidentsResolved,
        Double mttrMinutes,
        List<DayStat> daily,
        List<NodeUptime> nodes
) {

    /** One calendar day (in the analytics time zone). */
    public record DayStat(
            LocalDate date,
            double availabilityPercent,
            long downtimeMinutes,
            int incidentsOpened,
            int incidentsResolved,
            Double mttrMinutes
    ) {
    }

    /** Uptime of one node: fixed SLA windows plus figures for the selected range. */
    public record NodeUptime(
            Long id,
            String name,
            String location,
            NodeStatus status,
            double uptime24h,
            double uptime7d,
            double uptime30d,
            double uptimeInRange,
            long downtimeMinutes,
            int outages,
            int incidents,
            boolean meetsSla
    ) {
    }
}
