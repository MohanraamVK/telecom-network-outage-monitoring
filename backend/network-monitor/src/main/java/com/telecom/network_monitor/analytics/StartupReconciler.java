package com.telecom.network_monitor.analytics;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Fixes outage history once at start-up, before the monitor's first check. */
@Component
public class StartupReconciler {

    private final NodeStatusHistoryService historyService;

    public StartupReconciler(NodeStatusHistoryService historyService) {
        this.historyService = historyService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void reconcile() {
        historyService.reconcileAfterRestart();
    }
}
