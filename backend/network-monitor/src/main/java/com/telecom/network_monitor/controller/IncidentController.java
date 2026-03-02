package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.entity.Incident;
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
    public Incident createIncident(@PathVariable Long nodeId,
                                   @RequestBody Incident incident) {
        return incidentService.createIncident(nodeId, incident);
    }

    @GetMapping("/node/{nodeId}")
    public List<Incident> getIncidentsByNode(@PathVariable Long nodeId) {
        return incidentService.getIncidentsByNode(nodeId);
    }
}