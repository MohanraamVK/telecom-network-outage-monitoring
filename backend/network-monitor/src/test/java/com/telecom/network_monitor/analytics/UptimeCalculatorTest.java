package com.telecom.network_monitor.analytics;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.entity.NodeStatusPeriod;
import com.telecom.network_monitor.enums.NodeStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class UptimeCalculatorTest {

    private static final LocalDateTime FROM = LocalDateTime.of(2026, 1, 1, 0, 0);
    private static final LocalDateTime TO = FROM.plusDays(1);
    private static final Node NODE = new Node();

    @Test
    void noPeriodsMeansFullUptime() {
        assertThat(UptimeCalculator.uptimePercent(List.of(), null, FROM, TO, TO)).isEqualTo(100.0);
    }

    @Test
    void downtimeReducesUptime() {
        // 72 minutes down in a 24h day = 95%
        var periods = List.of(period(NodeStatus.DOWN, FROM.plusHours(2), 72));
        assertThat(UptimeCalculator.uptimePercent(periods, null, FROM, TO, TO)).isEqualTo(95.0);
    }

    @Test
    void maintenanceIsExcludedFromMeasuredTime() {
        // 12h maintenance + 36 min down: measured 12h, uptime 95%
        var periods = List.of(
                period(NodeStatus.MAINTENANCE, FROM, 12 * 60),
                period(NodeStatus.DOWN, FROM.plusHours(13), 36));
        assertThat(UptimeCalculator.uptimePercent(periods, null, FROM, TO, TO)).isEqualTo(95.0);
    }

    @Test
    void periodsAreClippedToTheWindow() {
        // Started the evening before, ended at 01:12: only 72 minutes count
        var periods = List.of(period(NodeStatus.DOWN, FROM.minusHours(5), 5 * 60 + 72));
        assertThat(UptimeCalculator.uptimePercent(periods, null, FROM, TO, TO)).isEqualTo(95.0);
    }

    @Test
    void openPeriodRunsUntilNow() {
        NodeStatusPeriod open = new NodeStatusPeriod(NODE, NodeStatus.DOWN, FROM.plusHours(12), true);
        // Half the measured time (00:00-12:00 up, 12:00-24:00 down)
        assertThat(UptimeCalculator.uptimePercent(List.of(open), null, FROM, TO, TO)).isEqualTo(50.0);
    }

    @Test
    void nodeCreatedMidWindowIsOnlyMeasuredFromCreation() {
        var periods = List.of(period(NodeStatus.DOWN, FROM.plusHours(18), 36));
        // Exists for the last 12h; 36 min down = 95%
        assertThat(UptimeCalculator.uptimePercent(periods, FROM.plusHours(12), FROM, TO, TO)).isEqualTo(95.0);
    }

    @Test
    void fullMaintenanceWindowReportsHundred() {
        var periods = List.of(period(NodeStatus.MAINTENANCE, FROM.minusDays(1), 3 * 24 * 60));
        assertThat(UptimeCalculator.uptimePercent(periods, null, FROM, TO, TO)).isEqualTo(100.0);
    }

    private static NodeStatusPeriod period(NodeStatus status, LocalDateTime start, int minutes) {
        NodeStatusPeriod period = new NodeStatusPeriod(NODE, status, start, false);
        period.setEndedAt(start.plusMinutes(minutes));
        return period;
    }
}
