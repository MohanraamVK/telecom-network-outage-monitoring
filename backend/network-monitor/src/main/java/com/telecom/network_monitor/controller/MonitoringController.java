package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.ApiResponse;
import com.telecom.network_monitor.dto.NodeHealthDTO;
import com.telecom.network_monitor.monitoring.MonitoringQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monitoring")
@Tag(name = "Monitoring API", description = "Live node health and heartbeats")
public class MonitoringController {

    private final MonitoringQueryService monitoringQueryService;

    public MonitoringController(MonitoringQueryService monitoringQueryService) {
        this.monitoringQueryService = monitoringQueryService;
    }

    @Operation(summary = "Live health of all nodes",
            description = "Status, last heartbeat and recent latency samples per node")
    @GetMapping("/nodes")
    public ApiResponse<List<NodeHealthDTO>> nodeHealth() {
        return new ApiResponse<>(true, "Node health fetched successfully", monitoringQueryService.currentHealth());
    }

    @Operation(summary = "Report a heartbeat",
            description = "For real devices or agents. The outage detector treats a node as DOWN when heartbeats stop.")
    @PostMapping("/nodes/{id}/heartbeat")
    public ApiResponse<Object> heartbeat(@PathVariable Long id, @RequestParam(defaultValue = "0") int latencyMs) {
        monitoringQueryService.recordHeartbeat(id, latencyMs);
        return new ApiResponse<>(true, "Heartbeat recorded", null);
    }
}
