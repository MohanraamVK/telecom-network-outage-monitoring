package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.dto.NodeDTO;
import com.telecom.network_monitor.service.NodeService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/nodes")
public class NodeController {

    private final NodeService nodeService;

    public NodeController(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    @PostMapping
    public NodeDTO createNode(@RequestBody NodeDTO dto) {
        return nodeService.createNode(dto);
    }

    @GetMapping
    public List<NodeDTO> getAllNodes() {
        return nodeService.getAllNodes();
    }

    @GetMapping("/{id}")
    public NodeDTO getNodeById(@PathVariable Long id) {
        return nodeService.getNodeById(id);
    }

    @PutMapping("/{id}")
    public NodeDTO updateNode(@PathVariable Long id, @RequestBody NodeDTO dto) {
        return nodeService.updateNode(id, dto);
    }
}