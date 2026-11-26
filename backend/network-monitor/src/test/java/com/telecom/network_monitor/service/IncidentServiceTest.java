package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.IncidentRequestDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.exception.BadRequestException;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.entity.IncidentEvent;
import com.telecom.network_monitor.enums.IncidentEventType;
import com.telecom.network_monitor.realtime.LiveEventPublisher;
import com.telecom.network_monitor.repository.IncidentEventRepository;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class IncidentServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-15T10:00:00Z");
    private static final LocalDateTime NOW_LOCAL = LocalDateTime.ofInstant(NOW, ZoneOffset.UTC);

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private NodeRepository nodeRepository;

    @Mock
    private IncidentEventRepository eventRepository;

    @Mock
    private LiveEventPublisher liveEvents;

    private IncidentService incidentService;

    @BeforeEach
    void setUp() {
        incidentService = new IncidentService(incidentRepository, nodeRepository, eventRepository, liveEvents,
                Clock.fixed(NOW, ZoneOffset.UTC));
        when(eventRepository.save(any(IncidentEvent.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createIncidentForActiveNode() {
        Node node = node(1L, false);
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentDTO dto = incidentService.createIncident(1L,
                new IncidentRequestDTO("  Fibre cut  ", "high", "open"));

        assertThat(dto.getDescription()).isEqualTo("Fibre cut");
        assertThat(dto.getSeverity()).isEqualTo(IncidentSeverity.HIGH);
        assertThat(dto.getStatus()).isEqualTo(IncidentStatus.OPEN);
        assertThat(dto.getNodeId()).isEqualTo(1L);
        assertThat(dto.getNodeName()).isEqualTo("Tower-1");
        assertThat(dto.getResolvedAt()).isNull();
    }

    @Test
    void createIncidentAlreadyResolvedSetsResolvedAt() {
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node(1L, false)));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentDTO dto = incidentService.createIncident(1L,
                new IncidentRequestDTO("Brief power dip", "LOW", "RESOLVED"));

        assertThat(dto.getResolvedAt()).isEqualTo(NOW_LOCAL);
    }

    @Test
    void createIncidentForDeletedNodeFails() {
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node(1L, true)));

        assertThatThrownBy(() -> incidentService.createIncident(1L,
                new IncidentRequestDTO("x", "LOW", "OPEN")))
                .isInstanceOf(ResourceNotFoundException.class);
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void createIncidentWithInvalidSeverityFails() {
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node(1L, false)));

        assertThatThrownBy(() -> incidentService.createIncident(1L,
                new IncidentRequestDTO("x", "URGENT", "OPEN")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid severity");
    }

    @Test
    void resolvingIncidentRecordsResolvedAt() {
        Incident incident = incident(10L, IncidentStatus.IN_PROGRESS);
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentDTO dto = incidentService.updateIncidentStatus(10L, "RESOLVED");

        assertThat(dto.getStatus()).isEqualTo(IncidentStatus.RESOLVED);
        assertThat(dto.getResolvedAt()).isEqualTo(NOW_LOCAL);
    }

    @Test
    void closingResolvedIncidentKeepsOriginalResolvedAt() {
        LocalDateTime resolvedEarlier = NOW_LOCAL.minusHours(2);
        Incident incident = incident(10L, IncidentStatus.RESOLVED);
        incident.setResolvedAt(resolvedEarlier);
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentDTO dto = incidentService.updateIncidentStatus(10L, "CLOSED");

        assertThat(dto.getResolvedAt()).isEqualTo(resolvedEarlier);
    }

    @Test
    void reopeningIncidentClearsResolvedAt() {
        Incident incident = incident(10L, IncidentStatus.RESOLVED);
        incident.setResolvedAt(NOW_LOCAL.minusHours(1));
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentDTO dto = incidentService.updateIncidentStatus(10L, "OPEN");

        assertThat(dto.getStatus()).isEqualTo(IncidentStatus.OPEN);
        assertThat(dto.getResolvedAt()).isNull();
    }

    @Test
    void closedIncidentCannotBeReopened() {
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident(10L, IncidentStatus.CLOSED)));

        assertThatThrownBy(() -> incidentService.updateIncidentStatus(10L, "OPEN"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Closed incidents are final");
        verify(incidentRepository, never()).save(any());
    }

    @Test
    void updatingDeletedIncidentFails() {
        Incident incident = incident(10L, IncidentStatus.OPEN);
        incident.setDeleted(true);
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident));

        assertThatThrownBy(() -> incidentService.updateIncidentStatus(10L, "RESOLVED"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void restoringIncidentOfDeletedNodeFails() {
        Incident incident = incident(10L, IncidentStatus.OPEN);
        incident.setDeleted(true);
        incident.getNode().setDeleted(true);
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident));

        assertThatThrownBy(() -> incidentService.restoreIncident(10L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Restore the node first");
    }

    @Test
    void statusChangeIsRecordedOnTimelineAndBroadcast() {
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident(10L, IncidentStatus.OPEN)));
        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        incidentService.updateIncidentStatus(10L, "IN_PROGRESS");

        ArgumentCaptor<IncidentEvent> event = ArgumentCaptor.forClass(IncidentEvent.class);
        verify(eventRepository).save(event.capture());
        assertThat(event.getValue().getType()).isEqualTo(IncidentEventType.STATUS_CHANGED);
        assertThat(event.getValue().getFromStatus()).isEqualTo(IncidentStatus.OPEN);
        assertThat(event.getValue().getToStatus()).isEqualTo(IncidentStatus.IN_PROGRESS);
        assertThat(event.getValue().getCreatedAt()).isEqualTo(NOW_LOCAL);
        verify(liveEvents).incidentChanged(10L, "updated");
    }

    @Test
    void settingTheSameStatusChangesNothing() {
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident(10L, IncidentStatus.OPEN)));

        incidentService.updateIncidentStatus(10L, "OPEN");

        verify(incidentRepository, never()).save(any());
        verify(eventRepository, never()).save(any());
    }

    @Test
    void noteIsAddedToTimeline() {
        when(incidentRepository.findById(10L)).thenReturn(Optional.of(incident(10L, IncidentStatus.OPEN)));

        var dto = incidentService.addNote(10L, "  Engineer on site  ");

        assertThat(dto.type()).isEqualTo(IncidentEventType.NOTE);
        assertThat(dto.message()).isEqualTo("Engineer on site");
        assertThat(dto.incidentId()).isEqualTo(10L);
    }

    @Test
    void autoResolveOnlyTouchesDetectorIncidents() {
        Incident auto = incident(10L, IncidentStatus.OPEN);
        auto.setAutoGenerated(true);
        when(incidentRepository.findByNodeIdAndAutoGeneratedTrueAndDeletedFalseAndStatusIn(1L, IncidentService.UNRESOLVED))
                .thenReturn(List.of(auto));

        int resolved = incidentService.autoResolveForNode(1L, "Heartbeat restored");

        assertThat(resolved).isEqualTo(1);
        assertThat(auto.getStatus()).isEqualTo(IncidentStatus.RESOLVED);
        assertThat(auto.getResolvedAt()).isEqualTo(NOW_LOCAL);
        ArgumentCaptor<IncidentEvent> event = ArgumentCaptor.forClass(IncidentEvent.class);
        verify(eventRepository).save(event.capture());
        assertThat(event.getValue().getType()).isEqualTo(IncidentEventType.AUTO_RESOLVED);
        assertThat(event.getValue().getActor()).isEqualTo("monitor");
    }

    private static Node node(Long id, boolean deleted) {
        Node node = new Node();
        node.setId(id);
        node.setName("Tower-" + id);
        node.setLocation("Gothenburg");
        node.setStatus(NodeStatus.ACTIVE);
        node.setDeleted(deleted);
        return node;
    }

    private static Incident incident(Long id, IncidentStatus status) {
        Incident incident = new Incident();
        incident.setId(id);
        incident.setDescription("Outage");
        incident.setSeverity(IncidentSeverity.HIGH);
        incident.setStatus(status);
        incident.setNode(node(1L, false));
        incident.setCreatedAt(NOW_LOCAL.minusHours(3));
        return incident;
    }
}
