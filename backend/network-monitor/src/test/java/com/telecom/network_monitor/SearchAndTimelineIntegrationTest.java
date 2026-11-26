package com.telecom.network_monitor;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.NodeDTO;
import com.telecom.network_monitor.dto.PageResponse;
import com.telecom.network_monitor.enums.IncidentEventType;
import com.telecom.network_monitor.enums.IncidentSeverity;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.enums.NodeStatus;
import com.telecom.network_monitor.search.IncidentSearchCriteria;
import com.telecom.network_monitor.search.NodeSearchCriteria;
import com.telecom.network_monitor.service.DashboardService;
import com.telecom.network_monitor.service.IncidentService;
import com.telecom.network_monitor.service.NodeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs against H2 with the real Flyway migrations and the demo seed data, so it
 * checks the schema, the JPA specifications and the timeline end to end.
 */
@SpringBootTest
class SearchAndTimelineIntegrationTest {

    @Autowired
    private NodeService nodeService;

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private DashboardService dashboardService;

    @Test
    void searchesNodesByNameOrLocationWithPaging() {
        PageResponse<NodeDTO> gothenburg = nodeService.search(
                new NodeSearchCriteria("gothenburg", null, false), 0, 10, "name,asc");
        assertThat(gothenburg.content()).extracting(NodeDTO::getName)
                .containsExactly("GBG-Core-01", "GBG-Tower-12");

        PageResponse<NodeDTO> page = nodeService.search(new NodeSearchCriteria(null, null, false), 1, 3, "name,asc");
        assertThat(page.totalElements()).isGreaterThanOrEqualTo(8);
        assertThat(page.content()).hasSize(3);
        assertThat(page.page()).isEqualTo(1);

        PageResponse<NodeDTO> maintenance = nodeService.search(
                new NodeSearchCriteria(null, NodeStatus.MAINTENANCE, false), 0, 10, null);
        assertThat(maintenance.content()).extracting(NodeDTO::getName).contains("OSD-Tower-05");
    }

    @Test
    void searchesIncidentsByTextStatusAndSeverity() {
        PageResponse<IncidentDTO> byNodeName = incidentService.search(
                new IncidentSearchCriteria("STO-", null, null, null, false), 0, 20, null);
        assertThat(byNodeName.content()).isNotEmpty()
                .allSatisfy(i -> assertThat(i.getNodeName()).startsWith("STO-"));

        PageResponse<IncidentDTO> openLow = incidentService.search(
                new IncidentSearchCriteria(null, IncidentStatus.OPEN, IncidentSeverity.LOW, null, false), 0, 20, null);
        assertThat(openLow.content()).allSatisfy(i -> {
            assertThat(i.getStatus()).isEqualTo(IncidentStatus.OPEN);
            assertThat(i.getSeverity()).isEqualTo(IncidentSeverity.LOW);
        });

        PageResponse<IncidentDTO> wildcard = incidentService.search(
                new IncidentSearchCriteria("100%", null, null, null, false), 0, 20, null);
        assertThat(wildcard.content()).isEmpty(); // % is matched literally, not as a wildcard
    }

    @Test
    void sortsBySeverityRankNotAlphabetically() {
        PageResponse<IncidentDTO> sorted = incidentService.search(
                new IncidentSearchCriteria(null, null, null, null, false), 0, 50, "severity,desc");

        assertThat(sorted.content()).isNotEmpty();
        assertThat(sorted.content().get(0).getSeverity()).isEqualTo(IncidentSeverity.CRITICAL);
        assertThat(sorted.content().get(sorted.content().size() - 1).getSeverity()).isEqualTo(IncidentSeverity.LOW);
    }

    @Test
    void seededHistoryHasTimelineActivityAndMttr() {
        IncidentDTO fibreCut = incidentService.search(
                new IncidentSearchCriteria("fibre cut", null, null, null, false), 0, 1, null).content().get(0);

        var timeline = incidentService.getTimeline(fibreCut.getId());
        assertThat(timeline).extracting(e -> e.type())
                .startsWith(IncidentEventType.CREATED)
                .contains(IncidentEventType.NOTE)
                .endsWith(IncidentEventType.STATUS_CHANGED);

        assertThat(incidentService.getRecentActivity(5)).hasSize(5)
                .allSatisfy(e -> assertThat(e.nodeName()).isNotBlank());

        assertThat(dashboardService.getDashboardSummary().getAverageResolutionMinutes()).isNotNull().isPositive();
    }
}
