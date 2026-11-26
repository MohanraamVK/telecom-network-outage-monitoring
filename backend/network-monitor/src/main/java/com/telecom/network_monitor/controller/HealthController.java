package com.telecom.network_monitor.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Lightweight public endpoint used by the hosting platform's health checks. */
@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "Liveness check")
public class HealthController {

    @Operation(summary = "Liveness check")
    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "UP");
    }
}
