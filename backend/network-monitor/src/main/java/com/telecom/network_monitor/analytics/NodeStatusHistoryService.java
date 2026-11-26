package com.telecom.network_monitor.analytics;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.entity.NodeStatusPeriod;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.NodeRepository;
import com.telecom.network_monitor.repository.NodeStatusPeriodRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Records when nodes go DOWN or into MAINTENANCE and when they come back,
 * as {@link NodeStatusPeriod}s. Uptime and SLA numbers are computed from these.
 */
@Service
public class NodeStatusHistoryService {

    private static final Logger log = LoggerFactory.getLogger(NodeStatusHistoryService.class);

    /** A gap this long since the last persisted heartbeat means the app itself was asleep or down. */
    static final Duration APP_GAP = Duration.ofMinutes(3);

    private final NodeStatusPeriodRepository periodRepository;
    private final NodeRepository nodeRepository;
    private final Clock clock;

    @Autowired
    public NodeStatusHistoryService(NodeStatusPeriodRepository periodRepository, NodeRepository nodeRepository) {
        this(periodRepository, nodeRepository, Clock.systemDefaultZone());
    }

    NodeStatusHistoryService(NodeStatusPeriodRepository periodRepository, NodeRepository nodeRepository, Clock clock) {
        this.periodRepository = periodRepository;
        this.nodeRepository = nodeRepository;
        this.clock = clock;
    }

    /** Call whenever a node's status changes (or it is created, deleted or restored). */
    @Transactional
    public void recordTransition(Node node, NodeStatus from, NodeStatus to, boolean autoDetected) {
        if (from == to || node.getId() == null) {
            return;
        }
        LocalDateTime now = LocalDateTime.now(clock);
        closeOpenPeriod(node.getId(), now);
        if (to == NodeStatus.DOWN || to == NodeStatus.MAINTENANCE) {
            periodRepository.save(new NodeStatusPeriod(node, to, now, autoDetected));
        }
    }

    /** A deleted node stops counting from now on. */
    @Transactional
    public void nodeDeleted(Node node) {
        closeOpenPeriod(node.getId(), LocalDateTime.now(clock));
    }

    /**
     * After the app was asleep (e.g. a free hosting instance spun down), nobody was
     * watching, so detector-opened outages are cut off at the last moment the app was
     * seen running instead of counting the whole sleep as downtime. Nodes still DOWN
     * get a fresh period from now; the detector resolves them once heartbeats return.
     *
     * @return number of periods adjusted
     */
    @Transactional
    public int reconcileAfterRestart() {
        LocalDateTime lastSeen = nodeRepository.findLatestHeartbeat();
        LocalDateTime now = LocalDateTime.now(clock);
        if (lastSeen == null || Duration.between(lastSeen, now).compareTo(APP_GAP) < 0) {
            return 0;
        }

        int adjusted = 0;
        for (NodeStatusPeriod period : periodRepository.findByEndedAtIsNullAndAutoDetectedTrue()) {
            LocalDateTime end = period.getStartedAt().isAfter(lastSeen) ? period.getStartedAt() : lastSeen;
            period.setEndedAt(end);
            periodRepository.save(period);

            Node node = period.getNode();
            if (!node.isDeleted() && node.getStatus() == NodeStatus.DOWN) {
                periodRepository.save(new NodeStatusPeriod(node, NodeStatus.DOWN, now, true));
            }
            adjusted++;
        }
        if (adjusted > 0) {
            log.info("Closed {} outage period(s) at {} after the app was offline", adjusted, lastSeen);
        }
        return adjusted;
    }

    private void closeOpenPeriod(Long nodeId, LocalDateTime at) {
        periodRepository.findFirstByNodeIdAndEndedAtIsNullOrderByStartedAtDesc(nodeId).ifPresent(open -> {
            open.setEndedAt(at);
            periodRepository.save(open);
        });
    }
}
