package com.telecom.network_monitor.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IncidentStatusTest {

    @Test
    void closedIsFinal() {
        assertThat(IncidentStatus.CLOSED.allowedNextStatuses()).isEmpty();
        assertThat(IncidentStatus.CLOSED.canTransitionTo(IncidentStatus.OPEN)).isFalse();
    }

    @Test
    void resolvedIncidentCanBeReopened() {
        assertThat(IncidentStatus.RESOLVED.canTransitionTo(IncidentStatus.OPEN)).isTrue();
        assertThat(IncidentStatus.RESOLVED.canTransitionTo(IncidentStatus.IN_PROGRESS)).isTrue();
    }

    @Test
    void sameStatusIsAlwaysAllowed() {
        for (IncidentStatus status : IncidentStatus.values()) {
            assertThat(status.canTransitionTo(status)).isTrue();
        }
    }

    @Test
    void onlyResolvedAndClosedCountAsResolved() {
        assertThat(IncidentStatus.OPEN.isResolved()).isFalse();
        assertThat(IncidentStatus.IN_PROGRESS.isResolved()).isFalse();
        assertThat(IncidentStatus.RESOLVED.isResolved()).isTrue();
        assertThat(IncidentStatus.CLOSED.isResolved()).isTrue();
    }
}
