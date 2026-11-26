package com.telecom.network_monitor.config;

import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.IncidentEvent;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.IncidentEventType;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.IncidentEventRepository;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
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

    public DemoDataSeeder(NodeRepository nodeRepository, IncidentRepository incidentRepository,
                          IncidentEventRepository eventRepository) {
        this.nodeRepository = nodeRepository;
        this.incidentRepository = incidentRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (nodeRepository.count() > 0) {
            return;
        }

        List<Node> nodes = new ArrayList<>();
        for (int i = 0; i < NODES.length; i++) {
            Node node = new Node();
            node.setName(NODES[i][0]);
            node.setLocation(NODES[i][1]);
            node.setStatus(i == 7 ? NodeStatus.MAINTENANCE : NodeStatus.ACTIVE);
            nodes.add(nodeRepository.save(node));
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

        log.info("Seeded demo network with {} nodes", nodes.size());
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
