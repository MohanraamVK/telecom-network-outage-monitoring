package com.telecom.network_monitor.config;

import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.IncidentEvent;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.entity.NodeStatusPeriod;
import com.telecom.network_monitor.enums.IncidentEventType;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.IncidentEventRepository;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import com.telecom.network_monitor.repository.NodeStatusPeriodRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Fills an empty database with a small Swedish network and some incident history,
 * so a fresh deployment shows a living dashboard instead of empty charts.
 * Does nothing if any node already exists.
 */
@Component
@ConditionalOnProperty(prefix = "app.seed", name = "demo-data", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private static final String[][] NODES = {
            {"GBG-Core-01", "Gothenburg, Lindholmen"},
            {"GBG-Tower-12", "Gothenburg, Hisingen"},
            {"STO-Core-01", "Stockholm, Kista"},
            {"STO-Tower-07", "Stockholm, Södermalm"},
            {"MMO-Edge-03", "Malmö, Hyllie"},
            {"UPP-Tower-02", "Uppsala, Boländerna"},
            {"LUL-Edge-01", "Luleå, Porsön"},
            {"OSD-Tower-05", "Östersund, Lugnvik"},
    };

    private final NodeRepository nodeRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentEventRepository eventRepository;
    private final NodeStatusPeriodRepository periodRepository;

    public DemoDataSeeder(NodeRepository nodeRepository, IncidentRepository incidentRepository,
                          IncidentEventRepository eventRepository, NodeStatusPeriodRepository periodRepository) {
        this.nodeRepository = nodeRepository;
        this.incidentRepository = incidentRepository;
        this.eventRepository = eventRepository;
        this.periodRepository = periodRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (nodeRepository.count() > 0) {
            // Databases seeded before uptime tracking existed get the 30-day history once
            List<Node> demoNodes = existingDemoNodes();
            if (periodRepository.count() == 0 && demoNodes.size() == NODES.length) {
                seedHistory(demoNodes);
            }
            return;
        }

        List<Node> nodes = new ArrayList<>();
        for (int i = 0; i < NODES.length; i++) {
            Node node = new Node();
            node.setName(NODES[i][0]);
            node.setLocation(NODES[i][1]);
            node.setStatus(i == 7 ? NodeStatus.MAINTENANCE : NodeStatus.ACTIVE);
            Node saved = nodeRepository.saveAndFlush(node);
            // The demo network "has existed" for a while, so its seeded history counts towards uptime
            nodeRepository.backdateCreatedAt(saved.getId(), LocalDateTime.now().minusDays(45));
            saved.setCreatedAt(LocalDateTime.now().minusDays(45));
            nodes.add(saved);
        }

        LocalDateTime now = LocalDateTime.now();
        resolved(nodes.get(0), "Fibre cut on backbone link to Borås", IncidentSeverity.CRITICAL,
                now.minusDays(3).minusHours(2), 95, "Splicing crew dispatched; traffic rerouted via Jönköping.");
        resolved(nodes.get(2), "BGP session flapping with upstream peer", IncidentSeverity.HIGH,
                now.minusDays(2).minusHours(5), 42, "Peer reset after config rollback.");
        resolved(nodes.get(4), "Packet loss above 2% on edge router", IncidentSeverity.MEDIUM,
                now.minusDays(1).minusHours(8), 28, null);
        resolved(nodes.get(5), "Power supply alarm in cabinet B", IncidentSeverity.LOW,
                now.minusHours(20), 63, "Redundant PSU replaced.");
        open(nodes.get(3), "High CPU on aggregation switch", IncidentSeverity.MEDIUM,
                now.minusHours(3), IncidentStatus.IN_PROGRESS);
        open(nodes.get(6), "Intermittent backhaul latency spikes", IncidentSeverity.LOW,
                now.minusMinutes(50), IncidentStatus.OPEN);

        periodRepository.save(period(nodes.get(0), NodeStatus.DOWN, now.minusDays(3).minusHours(2), 95));
        seedHistory(nodes);
        log.info("Seeded demo network with {} nodes", nodes.size());
    }

    private List<Node> existingDemoNodes() {
        List<String> names = java.util.Arrays.stream(NODES).map(n -> n[0]).toList();
        return nodeRepository.findByDeletedFalseOrderByNameAsc().stream()
                .filter(n -> names.contains(n.getName()))
                .sorted(java.util.Comparator.comparingInt(n -> names.indexOf(n.getName())))
                .toList();
    }

    /**
     * Thirty days of short outages detected and resolved by the monitor, plus planned
     * maintenance, so uptime charts and SLA figures have something to show.
     * Deterministic (fixed seed) so every fresh deployment looks the same.
     */
    private void seedHistory(List<Node> nodes) {
        Random random = new Random(2026);
        LocalDateTime now = LocalDateTime.now();
        int created = 0;

        for (int daysAgo = 29; daysAgo >= 1; daysAgo--) {
            int outages = random.nextDouble() < 0.35 ? 0 : 1 + (random.nextDouble() < 0.3 ? 1 : 0);
            for (int k = 0; k < outages; k++) {
                // Edge and tower sites fail more often than core sites
                Node node = nodes.get(random.nextDouble() < 0.25 ? random.nextInt(3) : 3 + random.nextInt(4));
                LocalDateTime start = now.toLocalDate().minusDays(daysAgo).atStartOfDay()
                        .plusMinutes(random.nextInt(23 * 60));
                int minutes = 4 + (int) (Math.pow(random.nextDouble(), 2) * 150);
                autoOutage(node, start, minutes, daysAgo > 7);
                created++;
            }
        }

        // Planned work: excluded from uptime, shown separately
        periodRepository.save(period(nodes.get(5), NodeStatus.MAINTENANCE, now.minusDays(10).withHour(1), 180));
        if (nodes.get(7).getStatus() == NodeStatus.MAINTENANCE) {
            periodRepository.save(new NodeStatusPeriod(nodes.get(7), NodeStatus.MAINTENANCE, now.minusDays(2), false));
        }

        log.info("Seeded {} days of outage history ({} outages)", 30, created);
    }

    private void autoOutage(Node node, LocalDateTime start, int minutes, boolean closed) {
        String description = "Heartbeat lost: " + node.getName() + " has not responded for 30s";
        Incident incident = save(node, description, minutes > 60 ? IncidentSeverity.CRITICAL : IncidentSeverity.HIGH,
                closed ? IncidentStatus.CLOSED : IncidentStatus.RESOLVED, start);
        incident.setAutoGenerated(true);
        LocalDateTime end = start.plusMinutes(minutes);
        incident.setResolvedAt(end);
        incidentRepository.save(incident);

        event(incident, IncidentEventType.AUTO_DETECTED, null, IncidentStatus.OPEN, description, "monitor", start);
        event(incident, IncidentEventType.AUTO_RESOLVED, IncidentStatus.OPEN, IncidentStatus.RESOLVED,
                "Heartbeat restored: " + node.getName() + " is responding again", "monitor", end);
        if (closed) {
            event(incident, IncidentEventType.STATUS_CHANGED, IncidentStatus.RESOLVED, IncidentStatus.CLOSED,
                    null, "admin", end.plusHours(3));
        }
        periodRepository.save(period(node, NodeStatus.DOWN, start, minutes));
    }

    private static NodeStatusPeriod period(Node node, NodeStatus status, LocalDateTime start, int minutes) {
        NodeStatusPeriod period = new NodeStatusPeriod(node, status, start, status == NodeStatus.DOWN);
        period.setEndedAt(start.plusMinutes(minutes));
        return period;
    }

    private void resolved(Node node, String description, IncidentSeverity severity,
                          LocalDateTime openedAt, int minutesToResolve, String note) {
        Incident incident = save(node, description, severity, IncidentStatus.RESOLVED, openedAt);
        LocalDateTime ack = openedAt.plusMinutes(Math.max(3, minutesToResolve / 5));
        LocalDateTime resolvedAt = openedAt.plusMinutes(minutesToResolve);
        incident.setResolvedAt(resolvedAt);
        incidentRepository.save(incident);

        event(incident, IncidentEventType.CREATED, null, IncidentStatus.OPEN,
                "Incident raised with severity " + severity, "admin", openedAt);
        event(incident, IncidentEventType.STATUS_CHANGED, IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS,
                null, "admin", ack);
        if (note != null) {
            event(incident, IncidentEventType.NOTE, null, null, note, "admin", ack.plusMinutes(2));
        }
        event(incident, IncidentEventType.STATUS_CHANGED, IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED,
                null, "admin", resolvedAt);
    }

    private void open(Node node, String description, IncidentSeverity severity,
                      LocalDateTime openedAt, IncidentStatus status) {
        Incident incident = save(node, description, severity, status, openedAt);
        event(incident, IncidentEventType.CREATED, null, IncidentStatus.OPEN,
                "Incident raised with severity " + severity, "admin", openedAt);
        if (status == IncidentStatus.IN_PROGRESS) {
            event(incident, IncidentEventType.STATUS_CHANGED, IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS,
                    null, "admin", openedAt.plusMinutes(12));
        }
    }

    private Incident save(Node node, String description, IncidentSeverity severity,
                          IncidentStatus status, LocalDateTime openedAt) {
        Incident incident = new Incident();
        incident.setNode(node);
        incident.setDescription(description);
        incident.setSeverity(severity);
        incident.setStatus(status);
        Incident saved = incidentRepository.saveAndFlush(incident);
        // @CreationTimestamp always stamps "now"; backdate it for realistic history
        incidentRepository.backdateCreatedAt(saved.getId(), openedAt);
        saved.setCreatedAt(openedAt);
        return saved;
    }

    private void event(Incident incident, IncidentEventType type, IncidentStatus from, IncidentStatus to,
                       String message, String actor, LocalDateTime at) {
        eventRepository.save(new IncidentEvent(incident, type, from, to, message, actor, at));
    }
}
