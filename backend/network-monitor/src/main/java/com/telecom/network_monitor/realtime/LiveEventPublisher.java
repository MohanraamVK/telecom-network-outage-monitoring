package com.telecom.network_monitor.realtime;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Small facade so services don't need to know how events reach the browser. */
@Component
public class LiveEventPublisher {

    private final ApplicationEventPublisher publisher;

    public LiveEventPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void nodeChanged(Long nodeId, String action) {
        publisher.publishEvent(LiveEvent.of(LiveEvent.NODE_CHANGED, Map.of("id", nodeId, "action", action)));
    }

    public void incidentChanged(Long incidentId, String action) {
        publisher.publishEvent(LiveEvent.of(LiveEvent.INCIDENT_CHANGED, Map.of("id", incidentId, "action", action)));
    }

    public void publish(LiveEvent event) {
        publisher.publishEvent(event);
    }
}
