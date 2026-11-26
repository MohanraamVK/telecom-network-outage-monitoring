package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.analytics.AnalyticsService;
import com.telecom.network_monitor.dto.AnalyticsDTO;
import com.telecom.network_monitor.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@Tag(name = "Analytics API", description = "Uptime, SLA compliance and incident trends")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @Operation(summary = "Uptime and incident analytics",
            description = "Daily network availability, incidents opened/resolved, MTTR, and per-node uptime "
                    + "(24h, 7d, 30d and the selected range) against the SLA target. Maintenance is excluded.")
    @GetMapping
    public ApiResponse<AnalyticsDTO> analytics(@RequestParam(defaultValue = "7") int days) {
        return new ApiResponse<>(true, "Analytics fetched successfully", analyticsService.analytics(days));
    }
}
