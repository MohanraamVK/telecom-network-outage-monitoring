package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.IncidentDTO;
import com.telecom.network_monitor.dto.IncidentStatusUpdateDTO;
import com.telecom.network_monitor.service.IncidentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping("/node/{nodeId}")
    public IncidentDTO createIncident(@PathVariable Long nodeId,
                                      @RequestBody IncidentDTO dto) {
        return incidentService.createIncident(nodeId, dto);
    }

    @GetMapping
    public List<IncidentDTO> getAllIncidents(
            @RequestParam(required = false) String status) {
        return incidentService.getAllIncidents(status);
    }

    @GetMapping("/node/{nodeId}")
    public List<IncidentDTO> getIncidentsByNode(@PathVariable Long nodeId) {
        return incidentService.getIncidentsByNode(nodeId);
    }

    @PutMapping("/{id}/status")
    public IncidentDTO updateIncidentStatus(@PathVariable Long id,
                                        @RequestBody IncidentStatusUpdateDTO statusDTO) {
        return incidentService.updateIncidentStatus(id, statusDTO.getStatus());
    }
}