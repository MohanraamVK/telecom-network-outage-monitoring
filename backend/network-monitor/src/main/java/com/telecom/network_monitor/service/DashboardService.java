package com.telecom.network_monitor.service;

import com.telecom.network_monitor.dto.DashboardSummaryDTO;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.repository.IncidentRepository;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.stereotype.Service;

@Service
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

        return new DashboardSummaryDTO(
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
    }
}