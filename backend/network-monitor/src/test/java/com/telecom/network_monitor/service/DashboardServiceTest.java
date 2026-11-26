package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.DashboardSummaryDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
// The summary queries every status/severity; unstubbed ones should simply return 0.
@MockitoSettings(strictness = Strictness.LENIENT)
class DashboardServiceTest {

    @Mock
    private NodeRepository nodeRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void availabilityIsShareOfActiveNodes() {
        assertThat(DashboardService.availabilityPercent(3, 4)).isEqualTo(75.0);
        assertThat(DashboardService.availabilityPercent(2, 3)).isEqualTo(66.7);
        assertThat(DashboardService.availabilityPercent(0, 0)).isEqualTo(100.0);
    }

    @Test
    void averageResolutionIgnoresIncidentsWithoutTimestamps() {
        LocalDateTime start = LocalDateTime.of(2026, 1, 1, 8, 0);

        Incident thirtyMinutes = resolved(start, start.plusMinutes(30));
        Incident ninetyMinutes = resolved(start, start.plusMinutes(90));
        Incident legacy = resolved(null, start);

        assertThat(DashboardService.averageResolutionMinutes(List.of(thirtyMinutes, ninetyMinutes, legacy)))
                .isEqualTo(60.0);
        assertThat(DashboardService.averageResolutionMinutes(List.of(legacy))).isNull();
        assertThat(DashboardService.averageResolutionMinutes(List.of())).isNull();
    }

    @Test
    void summaryCombinesCounts() {
        when(nodeRepository.countByDeletedFalse()).thenReturn(4L);
        when(nodeRepository.countByStatusAndDeletedFalse(NodeStatus.ACTIVE)).thenReturn(3L);
        when(nodeRepository.countByStatusAndDeletedFalse(NodeStatus.DOWN)).thenReturn(1L);
        when(incidentRepository.countBySeverityAndDeletedFalse(IncidentSeverity.CRITICAL)).thenReturn(2L);

        DashboardSummaryDTO summary = dashboardService.getDashboardSummary();

        assertThat(summary.getTotalNodes()).isEqualTo(4);
        assertThat(summary.getActiveNodes()).isEqualTo(3);
        assertThat(summary.getDownNodes()).isEqualTo(1);
        assertThat(summary.getCriticalSeverityIncidents()).isEqualTo(2);
        assertThat(summary.getNetworkAvailabilityPercent()).isEqualTo(75.0);
        assertThat(summary.getAverageResolutionMinutes()).isNull();
    }

    private static Incident resolved(LocalDateTime createdAt, LocalDateTime resolvedAt) {
        Incident incident = new Incident();
        incident.setCreatedAt(createdAt);
        incident.setResolvedAt(resolvedAt);
        return incident;
    }
}
