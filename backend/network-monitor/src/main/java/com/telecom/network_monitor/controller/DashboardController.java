package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.ApiResponse;
import com.telecom.network_monitor.dto.DashboardSummaryDTO;
import com.telecom.network_monitor.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard API", description = "APIs for telecom monitoring dashboard metrics")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @Operation(summary = "Get dashboard summary", description = "Returns summary metrics for nodes and incidents")
    @GetMapping("/summary")
    public ApiResponse<DashboardSummaryDTO> getDashboardSummary() {
        return new ApiResponse<>(
                true,
                "Dashboard summary fetched successfully",
                dashboardService.getDashboardSummary()
        );
    }
}