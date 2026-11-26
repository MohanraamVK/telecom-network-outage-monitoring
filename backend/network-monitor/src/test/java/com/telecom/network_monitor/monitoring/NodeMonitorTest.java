package com.telecom.network_monitor.monitoring;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.realtime.LiveEvent;
import com.telecom.network_monitor.realtime.LiveEventPublisher;
import com.telecom.network_monitor.repository.NodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Random;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NodeMonitorTest {

    private static final Instant START = Instant.parse("2026-01-15T10:00:00Z");
    private static final Duration TIMEOUT = Duration.ofSeconds(30);

    @Mock
    private NodeRepository nodeRepository;
    @Mock
    private OutageService outageService;
    @Mock
    private LiveEventPublisher liveEvents;

    private final HeartbeatRegistry registry = new HeartbeatRegistry();
    private MutableClock clock;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(START);
    }

    @Test
    void silentActiveNodeIsMarkedDownAfterTimeout() {
        Node node = node(1L, NodeStatus.ACTIVE);
        NodeMonitor monitor = monitor(false, 0.0);
        registry.record(1L, START, 10);
        when(outageService.markDown(eq(1L), any())).thenReturn(true);

        clock.advance(Duration.ofSeconds(31));
        NodeStatus result = monitor.evaluate(node, clock.instant());

        assertThat(result).isEqualTo(NodeStatus.DOWN);
        verify(outageService).markDown(eq(1L), eq(Duration.ofSeconds(31)));
    }

    @Test
    void nothingHappensWithinTimeout() {
        Node node = node(1L, NodeStatus.ACTIVE);
        NodeMonitor monitor = monitor(false, 0.0);
        clock.advance(Duration.ofMinutes(5));
        registry.record(1L, clock.instant().minusSeconds(20), 10);

        assertThat(monitor.evaluate(node, clock.instant())).isEqualTo(NodeStatus.ACTIVE);
        verify(outageService, never()).markDown(anyLong(), any());
    }

    @Test
    void noAlertsDuringStartupGracePeriod() {
        Node node = node(1L, NodeStatus.ACTIVE);
        NodeMonitor monitor = monitor(false, 0.0);
        // Heartbeat persisted long before this instance started (e.g. after a cold start)
        registry.record(1L, START.minus(Duration.ofHours(1)), 10);

        clock.advance(Duration.ofSeconds(10));
        assertThat(monitor.evaluate(node, clock.instant())).isEqualTo(NodeStatus.ACTIVE);
        verify(outageService, never()).markDown(anyLong(), any());
    }

    @Test
    void nodesThatNeverReportedAreNotMarkedDown() {
        NodeMonitor monitor = monitor(false, 0.0);
        clock.advance(Duration.ofMinutes(5));

        assertThat(monitor.evaluate(node(1L, NodeStatus.ACTIVE), clock.instant())).isEqualTo(NodeStatus.ACTIVE);
        verify(outageService, never()).markDown(anyLong(), any());
    }

    @Test
    void maintenanceNodesNeverAlert() {
        NodeMonitor monitor = monitor(false, 0.0);
        registry.record(1L, START, 10);
        clock.advance(Duration.ofMinutes(5));

        assertThat(monitor.evaluate(node(1L, NodeStatus.MAINTENANCE), clock.instant()))
                .isEqualTo(NodeStatus.MAINTENANCE);
        verify(outageService, never()).markDown(anyLong(), any());
    }

    @Test
    void downNodeWithFreshHeartbeatIsRecovered() {
        NodeMonitor monitor = monitor(false, 0.0);
        clock.advance(Duration.ofMinutes(5));
        registry.record(1L, clock.instant(), 12);
        when(outageService.markRecovered(1L)).thenReturn(true);

        assertThat(monitor.evaluate(node(1L, NodeStatus.DOWN), clock.instant())).isEqualTo(NodeStatus.ACTIVE);
    }

    @Test
    void simulatorProducesHeartbeatsAndPublishesSnapshot() {
        Node node = node(1L, NodeStatus.ACTIVE);
        when(nodeRepository.findByDeletedFalseAndMonitoredTrue()).thenReturn(List.of(node));
        NodeMonitor monitor = monitor(true, 0.0);

        monitor.runCycle();

        assertThat(registry.lastHeartbeat(1L)).contains(START);
        assertThat(registry.lastLatency(1L)).hasValueSatisfying(ms -> assertThat(ms).isPositive());
        verify(liveEvents).publish(any(LiveEvent.class));
        verify(outageService).persistHeartbeats(any());
    }

    @Test
    void simulatedOutageSilencesNodeUntilItEnds() {
        Node node = node(1L, NodeStatus.ACTIVE);
        NodeMonitor monitor = monitor(true, 1.0); // always fail

        monitor.simulate(node, clock.instant());
        assertThat(monitor.isInSimulatedOutage(1L)).isTrue();
        assertThat(registry.lastHeartbeat(1L)).isEmpty();

        clock.advance(Duration.ofMinutes(10)); // longer than max outage
        node.setStatus(NodeStatus.DOWN);        // detector took it down meanwhile
        monitor.simulate(node, clock.instant());
        assertThat(monitor.isInSimulatedOutage(1L)).isFalse();
        assertThat(registry.lastHeartbeat(1L)).contains(clock.instant());
    }

    @Test
    void simulatedLatencyHasStablePerNodeBaseline() {
        NodeMonitor monitor = monitor(true, 0.0);
        for (int i = 0; i < 50; i++) {
            assertThat(monitor.simulatedLatency(7L)).isBetween(1, 250);
        }
    }

    private NodeMonitor monitor(boolean simulator, double failureProbability) {
        MonitoringProperties properties = new MonitoringProperties(true, Duration.ofSeconds(10), TIMEOUT,
                simulator, failureProbability, Duration.ofMinutes(1), Duration.ofMinutes(4));
        return new NodeMonitor(nodeRepository, outageService, registry, properties, liveEvents, clock, new Random(42));
    }

    private static Node node(Long id, NodeStatus status) {
        Node node = new Node();
        node.setId(id);
        node.setName("Node-" + id);
        node.setStatus(status);
        return node;
    }

    /** Test clock that can be moved forward. */
    static final class MutableClock extends Clock {
        private Instant now;

        MutableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
