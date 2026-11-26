package com.telecom.network_monitor.analytics;

import com.telecom.network_monitor.dto.AnalyticsDTO;
import com.telecom.network_monitor.dto.AnalyticsDTO.DayStat;
import com.telecom.network_monitor.dto.AnalyticsDTO.NodeUptime;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.entity.NodeStatusPeriod;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import com.telecom.network_monitor.repository.NodeStatusPeriodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;

/** Uptime, SLA compliance and incident trends over a time range. */
@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    public static final int MAX_DAYS = 90;

    private final NodeRepository nodeRepository;
    private final NodeStatusPeriodRepository periodRepository;
    private final IncidentRepository incidentRepository;
    private final double slaTargetPercent;
    private final ZoneId zone;
    private final Clock clock;

    @Autowired
    public AnalyticsService(NodeRepository nodeRepository,
                            NodeStatusPeriodRepository periodRepository,
                            IncidentRepository incidentRepository,
                            @Value("${app.sla.target-percent:99.5}") double slaTargetPercent,
                            @Value("${app.analytics.time-zone:Europe/Stockholm}") String zone) {
        this(nodeRepository, periodRepository, incidentRepository, slaTargetPercent, ZoneId.of(zone),
                Clock.systemDefaultZone());
    }

    AnalyticsService(NodeRepository nodeRepository, NodeStatusPeriodRepository periodRepository,
                     IncidentRepository incidentRepository, double slaTargetPercent, ZoneId zone, Clock clock) {
        this.nodeRepository = nodeRepository;
        this.periodRepository = periodRepository;
        this.incidentRepository = incidentRepository;
        this.slaTargetPercent = slaTargetPercent;
        this.zone = zone;
        this.clock = clock;
    }

    public AnalyticsDTO analytics(int requestedDays) {
        int days = Math.min(Math.max(requestedDays, 1), MAX_DAYS);
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.atZone(ZoneId.systemDefault()).withZoneSameInstant(zone).toLocalDate();
        LocalDateTime rangeFrom = startOf(today.minusDays(days - 1L));
        LocalDateTime earliest = min(rangeFrom, now.minusDays(30));

        List<Node> nodes = nodeRepository.findByDeletedFalseOrderByNameAsc();
        Map<Long, List<NodeStatusPeriod>> periodsByNode = periodRepository.findOverlapping(earliest, now).stream()
                .collect(Collectors.groupingBy(p -> p.getNode().getId()));
        List<Incident> incidents = incidentRepository.findActiveSince(rangeFrom);

        // ---- per day
        List<DayStat> daily = new ArrayList<>(days);
        long totalMeasured = 0;
        long totalDown = 0;
        for (int i = 0; i < days; i++) {
            LocalDate date = today.minusDays(days - 1L - i);
            LocalDateTime from = startOf(date);
            LocalDateTime to = min(startOf(date.plusDays(1)), now);

            long measured = 0;
            long down = 0;
            for (Node node : nodes) {
                List<NodeStatusPeriod> periods = periodsByNode.getOrDefault(node.getId(), List.of());
                LocalDateTime start = max(from, node.getCreatedAt());
                if (!to.isAfter(start)) {
                    continue;
                }
                long window = Duration.between(start, to).toSeconds();
                long nodeMeasured = window - UptimeCalculator.statusSeconds(periods, NodeStatus.MAINTENANCE, start, to, now);
                measured += Math.max(0, nodeMeasured);
                down += Math.min(Math.max(0, nodeMeasured),
                        UptimeCalculator.statusSeconds(periods, NodeStatus.DOWN, start, to, now));
            }
            totalMeasured += measured;
            totalDown += down;

            List<Incident> resolvedThatDay = incidents.stream()
                    .filter(inRange(Incident::getResolvedAt, from, to))
                    .toList();
            daily.add(new DayStat(
                    date,
                    percent(measured, down),
                    down / 60,
                    (int) incidents.stream().filter(inRange(Incident::getCreatedAt, from, to)).count(),
                    resolvedThatDay.size(),
                    mttr(resolvedThatDay)));
        }

        // ---- per node
        List<NodeUptime> nodeUptimes = new ArrayList<>(nodes.size());
        for (Node node : nodes) {
            List<NodeStatusPeriod> periods = periodsByNode.getOrDefault(node.getId(), List.of());
            double inRange = UptimeCalculator.uptimePercent(periods, node.getCreatedAt(), rangeFrom, now, now);
            double uptime30d = UptimeCalculator.uptimePercent(periods, node.getCreatedAt(), now.minusDays(30), now, now);
            int outages = (int) periods.stream()
                    .filter(p -> p.getStatus() == NodeStatus.DOWN && !p.getStartedAt().isBefore(rangeFrom))
                    .count();
            int nodeIncidents = (int) incidents.stream()
                    .filter(i -> i.getNode().getId().equals(node.getId()))
                    .filter(inRange(Incident::getCreatedAt, rangeFrom, now))
                    .count();
            nodeUptimes.add(new NodeUptime(
                    node.getId(),
                    node.getName(),
                    node.getLocation(),
                    node.getStatus(),
                    UptimeCalculator.uptimePercent(periods, node.getCreatedAt(), now.minusHours(24), now, now),
                    UptimeCalculator.uptimePercent(periods, node.getCreatedAt(), now.minusDays(7), now, now),
                    uptime30d,
                    inRange,
                    UptimeCalculator.statusSeconds(periods, NodeStatus.DOWN, max(rangeFrom, node.getCreatedAt()), now, now) / 60,
                    outages,
                    nodeIncidents,
                    uptime30d >= slaTargetPercent));
        }
        nodeUptimes.sort(Comparator.comparingDouble(NodeUptime::uptimeInRange)
                .thenComparing(NodeUptime::name));

        List<Incident> resolvedInRange = incidents.stream()
                .filter(inRange(Incident::getResolvedAt, rangeFrom, now))
                .toList();

        return new AnalyticsDTO(
                days,
                slaTargetPercent,
                percent(totalMeasured, totalDown),
                totalDown / 60,
                (int) incidents.stream().filter(inRange(Incident::getCreatedAt, rangeFrom, now)).count(),
                resolvedInRange.size(),
                mttr(resolvedInRange),
                daily,
                nodeUptimes);
    }

    // ---------------------------------------------------------------- helpers

    /** Midnight of {@code date} in the analytics zone, as server-local time (how timestamps are stored). */
    private LocalDateTime startOf(LocalDate date) {
        return date.atStartOfDay(zone).withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    }

    private static Predicate<Incident> inRange(java.util.function.Function<Incident, LocalDateTime> field,
                                               LocalDateTime from, LocalDateTime to) {
        return incident -> {
            LocalDateTime value = field.apply(incident);
            return value != null && !value.isBefore(from) && value.isBefore(to);
        };
    }

    private static Double mttr(List<Incident> resolved) {
        var average = resolved.stream()
                .filter(i -> i.getCreatedAt() != null && i.getResolvedAt() != null)
                .mapToLong(i -> Duration.between(i.getCreatedAt(), i.getResolvedAt()).toMinutes())
                .filter(m -> m >= 0)
                .average();
        return average.isPresent() ? Math.round(average.getAsDouble() * 10.0) / 10.0 : null;
    }

    private static double percent(long measured, long down) {
        return measured <= 0 ? 100.0 : UptimeCalculator.round3(100.0 * (measured - down) / measured);
    }

    private static LocalDateTime min(LocalDateTime a, LocalDateTime b) {
        return a.isBefore(b) ? a : b;
    }

    private static LocalDateTime max(LocalDateTime a, LocalDateTime b) {
        return b == null || a.isAfter(b) ? a : b;
    }
}
