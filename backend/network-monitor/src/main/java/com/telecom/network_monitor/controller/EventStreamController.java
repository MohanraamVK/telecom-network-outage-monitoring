package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.realtime.EventStreamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/events")
@Tag(name = "Live events", description = "Server-Sent Events stream of node, incident and monitoring changes")
public class EventStreamController {

    private final EventStreamService eventStreamService;

    public EventStreamController(EventStreamService eventStreamService) {
        this.eventStreamService = eventStreamService;
    }

    @Operation(summary = "Subscribe to live updates",
            description = "Long-lived text/event-stream. Event names: node.changed, incident.changed, monitoring.snapshot")
    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletResponse response) {
        // Stop proxies (e.g. Render's) from caching or buffering the stream
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no");
        return eventStreamService.subscribe();
    }
}
