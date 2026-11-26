package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.NodeDTO;
import com.telecom.network_monitor.dto.NodeRequestDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.exception.BadRequestException;
import com.telecom.network_monitor.exception.ResourceNotFoundException;
import com.telecom.network_monitor.monitoring.HeartbeatRegistry;
import com.telecom.network_monitor.realtime.LiveEventPublisher;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NodeServiceTest {

    @Mock
    private NodeRepository nodeRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private HeartbeatRegistry heartbeats;

    @Mock
    private LiveEventPublisher liveEvents;

    @InjectMocks
    private NodeService nodeService;

    @Test
    void createNodeTrimsInputAndParsesStatus() {
        when(nodeRepository.save(any(Node.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NodeDTO dto = nodeService.createNode(new NodeRequestDTO("  Tower-A1 ", " Gothenburg ", "maintenance"));

        assertThat(dto.getName()).isEqualTo("Tower-A1");
        assertThat(dto.getLocation()).isEqualTo("Gothenburg");
        assertThat(dto.getStatus()).isEqualTo(NodeStatus.MAINTENANCE);
    }

    @Test
    void createNodeWithInvalidStatusFails() {
        assertThatThrownBy(() -> nodeService.createNode(new NodeRequestDTO("Tower", "Gbg", "BROKEN")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Invalid node status");
        verify(nodeRepository, never()).save(any());
    }

    @Test
    void deleteNodeSoftDeletesItsIncidents() {
        Node node = nodeWithIncidents();
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));

        nodeService.deleteNode(1L);

        assertThat(node.isDeleted()).isTrue();
        assertThat(node.getIncidents()).allMatch(Incident::isDeleted);
        verify(nodeRepository).save(node);
        verify(heartbeats).forget(1L);
        verify(liveEvents).nodeChanged(1L, "deleted");
    }

    @Test
    void restoreNodeRestoresItsIncidents() {
        Node node = nodeWithIncidents();
        node.setDeleted(true);
        node.getIncidents().forEach(incident -> incident.setDeleted(true));
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));

        String message = nodeService.restoreNode(1L);

        assertThat(message).isEqualTo("Node restored successfully!");
        assertThat(node.isDeleted()).isFalse();
        assertThat(node.getIncidents()).noneMatch(Incident::isDeleted);
    }

    @Test
    void getDeletedNodeByIdIsNotFound() {
        Node node = nodeWithIncidents();
        node.setDeleted(true);
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));

        assertThatThrownBy(() -> nodeService.getNodeById(1L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void activeNodeViewHidesDeletedIncidents() {
        Node node = nodeWithIncidents();
        node.getIncidents().get(0).setDeleted(true);
        when(nodeRepository.findById(1L)).thenReturn(Optional.of(node));

        NodeDTO dto = nodeService.getNodeById(1L);

        assertThat(dto.getIncidents()).hasSize(1);
        assertThat(dto.getOpenIncidentCount()).isEqualTo(1);
    }

    private static Node nodeWithIncidents() {
        Node node = new Node();
        node.setId(1L);
        node.setName("Tower-1");
        node.setLocation("Gothenburg");
        node.setStatus(NodeStatus.DOWN);

        List<Incident> incidents = new ArrayList<>();
        for (long id = 1; id <= 2; id++) {
            Incident incident = new Incident();
            incident.setId(id);
            incident.setDescription("Incident " + id);
            incident.setSeverity(IncidentSeverity.MEDIUM);
            incident.setStatus(IncidentStatus.OPEN);
            incident.setNode(node);
            incidents.add(incident);
        }
        node.setIncidents(incidents);
        return node;
    }
}
