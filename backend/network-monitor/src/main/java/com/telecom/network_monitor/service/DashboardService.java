package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.DashboardSummaryDTO;
import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.EnumSet;
import java.util.List;
import java.util.OptionalDouble;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final NodeRepository nodeRepository;
    private final IncidentRepository incidentRepository;

    public DashboardService(NodeRepository nodeRepository, IncidentRepository incidentRepository) {
        this.nodeRepository = nodeRepository;
        this.incidentRepository = incidentRepository;
    }

    public DashboardSummaryDTO getDashboardSummary() {
        long activeNodes = nodeRepository.countByStatusAndDeletedFalse(NodeStatus.ACTIVE);
        long downNodes = nodeRepository.countByStatusAndDeletedFalse(NodeStatus.DOWN);
        long maintenanceNodes = nodeRepository.countByStatusAndDeletedFalse(NodeStatus.MAINTENANCE);
        long deletedNodes = nodeRepository.countByDeletedTrue();
        long totalNodes = nodeRepository.countByDeletedFalse();

        long openIncidents = incidentRepository.countByStatusAndDeletedFalse(IncidentStatus.OPEN);
        long inProgressIncidents = incidentRepository.countByStatusAndDeletedFalse(IncidentStatus.IN_PROGRESS);
        long resolvedIncidents = incidentRepository.countByStatusAndDeletedFalse(IncidentStatus.RESOLVED);
        long closedIncidents = incidentRepository.countByStatusAndDeletedFalse(IncidentStatus.CLOSED);
        long deletedIncidents = incidentRepository.countByDeletedTrue();
        long totalIncidents = incidentRepository.countByDeletedFalse();

        DashboardSummaryDTO summary = new DashboardSummaryDTO(
                totalNodes,
                activeNodes,
                downNodes,
                maintenanceNodes,
                deletedNodes,
                totalIncidents,
                openIncidents,
                inProgressIncidents,
                resolvedIncidents,
                closedIncidents,
                deletedIncidents
        );

        summary.setLowSeverityIncidents(incidentRepository.countBySeverityAndDeletedFalse(IncidentSeverity.LOW));
        summary.setMediumSeverityIncidents(incidentRepository.countBySeverityAndDeletedFalse(IncidentSeverity.MEDIUM));
        summary.setHighSeverityIncidents(incidentRepository.countBySeverityAndDeletedFalse(IncidentSeverity.HIGH));
        summary.setCriticalSeverityIncidents(incidentRepository.countBySeverityAndDeletedFalse(IncidentSeverity.CRITICAL));
        summary.setUnresolvedCriticalIncidents(incidentRepository.countBySeverityAndStatusInAndDeletedFalse(
                IncidentSeverity.CRITICAL, EnumSet.of(IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS)));

        summary.setNetworkAvailabilityPercent(availabilityPercent(activeNodes, totalNodes));
        summary.setAverageResolutionMinutes(
                averageResolutionMinutes(incidentRepository.findByDeletedFalseAndResolvedAtIsNotNull()));

        return summary;
    }

    static double availabilityPercent(long activeNodes, long totalNodes) {
        if (totalNodes == 0) {
            return 100.0;
        }
        double percent = (activeNodes * 100.0) / totalNodes;
        return Math.round(percent * 10.0) / 10.0;
    }

    static Double averageResolutionMinutes(List<Incident> resolvedIncidents) {
        OptionalDouble average = resolvedIncidents.stream()
                // Incidents created before timestamps were introduced have no createdAt.
                .filter(incident -> incident.getCreatedAt() != null && incident.getResolvedAt() != null)
                .mapToLong(incident -> Duration.between(incident.getCreatedAt(), incident.getResolvedAt()).toMinutes())
                .filter(minutes -> minutes >= 0)
                .average();

        if (average.isEmpty()) {
            return null;
        }
        return Math.round(average.getAsDouble() * 10.0) / 10.0;
    }
}
