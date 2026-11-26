package com.telecom.network_monitor.analytics;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.entity.NodeStatusPeriod;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.NodeRepository;
import com.telecom.network_monitor.repository.NodeStatusPeriodRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class NodeStatusHistoryServiceTest {

    private static final Instant NOW = Instant.parse("2026-03-01T12:00:00Z");
    private static final LocalDateTime NOW_LOCAL = LocalDateTime.ofInstant(NOW, ZoneOffset.UTC);

    @Mock
    private NodeStatusPeriodRepository periodRepository;
    @Mock
    private NodeRepository nodeRepository;

    private NodeStatusHistoryService service;
    private Node node;

    @BeforeEach
    void setUp() {
        service = new NodeStatusHistoryService(periodRepository, nodeRepository, Clock.fixed(NOW, ZoneOffset.UTC));
        node = new Node();
        node.setId(1L);
        node.setStatus(NodeStatus.DOWN);
        when(periodRepository.save(any(NodeStatusPeriod.class))).thenAnswer(i -> i.getArgument(0));
    }

    @Test
    void goingDownOpensPeriod() {
        when(periodRepository.findFirstByNodeIdAndEndedAtIsNullOrderByStartedAtDesc(1L)).thenReturn(Optional.empty());

        service.recordTransition(node, NodeStatus.ACTIVE, NodeStatus.DOWN, true);

        ArgumentCaptor<NodeStatusPeriod> saved = ArgumentCaptor.forClass(NodeStatusPeriod.class);
        verify(periodRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(NodeStatus.DOWN);
        assertThat(saved.getValue().getStartedAt()).isEqualTo(NOW_LOCAL);
        assertThat(saved.getValue().isAutoDetected()).isTrue();
    }

    @Test
    void recoveringClosesOpenPeriod() {
        NodeStatusPeriod open = new NodeStatusPeriod(node, NodeStatus.DOWN, NOW_LOCAL.minusMinutes(5), true);
        when(periodRepository.findFirstByNodeIdAndEndedAtIsNullOrderByStartedAtDesc(1L)).thenReturn(Optional.of(open));

        service.recordTransition(node, NodeStatus.DOWN, NodeStatus.ACTIVE, true);

        assertThat(open.getEndedAt()).isEqualTo(NOW_LOCAL);
        verify(periodRepository, times(1)).save(any());
    }

    @Test
    void sameStatusRecordsNothing() {
        service.recordTransition(node, NodeStatus.DOWN, NodeStatus.DOWN, false);
        verify(periodRepository, never()).save(any());
    }

    @Test
    void sleepGapIsNotCountedAsDowntime() {
        // App last seen two hours ago; an auto outage started three hours ago and is still open
        when(nodeRepository.findLatestHeartbeat()).thenReturn(NOW_LOCAL.minusHours(2));
        NodeStatusPeriod open = new NodeStatusPeriod(node, NodeStatus.DOWN, NOW_LOCAL.minusHours(3), true);
        when(periodRepository.findByEndedAtIsNullAndAutoDetectedTrue()).thenReturn(List.of(open));

        int adjusted = service.reconcileAfterRestart();

        assertThat(adjusted).isEqualTo(1);
        assertThat(open.getEndedAt()).isEqualTo(NOW_LOCAL.minusHours(2));
        // Node is still DOWN, so a fresh period starts now
        ArgumentCaptor<NodeStatusPeriod> saved = ArgumentCaptor.forClass(NodeStatusPeriod.class);
        verify(periodRepository, times(2)).save(saved.capture());
        assertThat(saved.getAllValues().get(1).getStartedAt()).isEqualTo(NOW_LOCAL);
    }

    @Test
    void normalRestartChangesNothing() {
        when(nodeRepository.findLatestHeartbeat()).thenReturn(NOW_LOCAL.minusSeconds(40));

        assertThat(service.reconcileAfterRestart()).isZero();
        verify(periodRepository, never()).findByEndedAtIsNullAndAutoDetectedTrue();
    }
}
