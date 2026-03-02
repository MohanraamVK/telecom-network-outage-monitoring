package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.entity.Node;
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
    public Node createNode(@RequestBody Node node) {
        return nodeService.createNode(node);
    }

    @GetMapping
    public List<Node> getAllNodes() {
        return nodeService.getAllNodes();
    }

    @PutMapping("/{id}")
    public Node updateNode(@PathVariable Long id,
                           @RequestBody Node node) {
        return nodeService.updateNode(id, node);
    }

    @DeleteMapping("/{id}")
    public void deleteNode(@PathVariable Long id) {
        nodeService.deleteNode(id);
    }
}