package com.telecom.network_monitor.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Incident workflow:
 *
 * <pre>
 *   OPEN ⇄ IN_PROGRESS ⇄ RESOLVED ──► CLOSED (final)
 *     └──────────────────────────────►
 * </pre>
 *
 * A resolved incident can be re-opened if the fault comes back; a closed one
 * is final and a new incident should be raised instead.
 */
public enum IncidentStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    CLOSED;

    public Set<IncidentStatus> allowedNextStatuses() {
        return switch (this) {
            case OPEN -> EnumSet.of(IN_PROGRESS, RESOLVED, CLOSED);
            case IN_PROGRESS -> EnumSet.of(OPEN, RESOLVED, CLOSED);
            case RESOLVED -> EnumSet.of(OPEN, IN_PROGRESS, CLOSED);
            case CLOSED -> EnumSet.noneOf(IncidentStatus.class);
        };
    }

    public boolean canTransitionTo(IncidentStatus next) {
        return next == this || allowedNextStatuses().contains(next);
    }

    /** True once the outage is over (used for resolution-time metrics). */
    public boolean isResolved() {
        return this == RESOLVED || this == CLOSED;
    }
}
