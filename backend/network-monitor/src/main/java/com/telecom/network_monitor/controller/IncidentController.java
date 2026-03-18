package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.ApiResponse;
import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.IncidentRequestDTO;
import com.telecom.network_monitor.dto.IncidentStatusUpdateDTO;
import com.telecom.network_monitor.enums.IncidentStatus;
import com.telecom.network_monitor.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@Tag(name = "Incident API", description = "APIs for managing telecom incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @Operation(
            summary = "Create incident for a node",
            description = "Creates a new incident for a specific telecom node",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            examples = @ExampleObject(
                                    name = "Create Incident Example",
                                    value = """
                                            {
                                              "description": "Power failure in sector 5",
                                              "severity": "HIGH",
                                              "status": "OPEN"
                                            }
                                            """
                            )
                    )
            )
    )
    @PostMapping("/node/{nodeId}")
    public ApiResponse<IncidentDTO> createIncident(@PathVariable Long nodeId,
                                                   @Valid @RequestBody IncidentRequestDTO dto) {
        return new ApiResponse<>(
                true,
                "Incident created successfully",
                incidentService.createIncident(nodeId, dto)
        );
    }

    @Operation(summary = "Get incidents by node ID")
    @GetMapping("/node/{nodeId}")
    public ApiResponse<List<IncidentDTO>> getIncidentsByNode(@PathVariable Long nodeId) {
        return new ApiResponse<>(
                true,
                "Incidents for node fetched successfully",
                incidentService.getIncidentsByNode(nodeId)
        );
    }

    @Operation(summary = "Get all active incidents", description = "Optionally filter by status")
    @GetMapping
    public ApiResponse<List<IncidentDTO>> getAllIncidents(@RequestParam(required = false) IncidentStatus status) {
        return new ApiResponse<>(
                true,
                "Incidents fetched successfully",
                incidentService.getAllIncidents(status)
        );
    }

    @Operation(summary = "Get all soft deleted incidents")
    @GetMapping("/deleted")
    public ApiResponse<List<IncidentDTO>> getDeletedIncidents() {
        return new ApiResponse<>(
                true,
                "Deleted incidents fetched successfully",
                incidentService.getDeletedIncidents()
        );
    }

    @Operation(
            summary = "Update incident status",
            description = "Updates the status of an incident",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                    required = true,
                    content = @Content(
                            examples = @ExampleObject(
                                    name = "Update Incident Status Example",
                                    value = """
                                            {
                                              "status": "RESOLVED"
                                            }
                                            """
                            )
                    )
            )
    )
    @PutMapping("/{id}/status")
    public ApiResponse<IncidentDTO> updateIncidentStatus(@PathVariable Long id,
                                                         @Valid @RequestBody IncidentStatusUpdateDTO statusDTO) {
        return new ApiResponse<>(
                true,
                "Incident status updated successfully",
                incidentService.updateIncidentStatus(id, statusDTO.getStatus())
        );
    }

    @Operation(summary = "Restore soft deleted incident by ID")
    @PutMapping("/{id}/restore")
    public ApiResponse<Object> restoreIncident(@PathVariable Long id) {
        return new ApiResponse<>(
                true,
                incidentService.restoreIncident(id),
                null
        );
    }

    @Operation(summary = "Soft delete incident by ID")
    @DeleteMapping("/{id}")
    public ApiResponse<Object> deleteIncident(@PathVariable Long id) {
        return new ApiResponse<>(
                true,
                incidentService.deleteIncident(id),
                null
        );
    }
}