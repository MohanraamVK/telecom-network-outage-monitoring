package com.telecom.network_monitor.controller;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.service.NodeService;

import org.jspecify.annotations.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/nodes")
public class NodeController {

    private final NodeService nodeService;

    public NodeController(NodeService nodeService) {
        this.nodeService = nodeService;
    }

    // CREATE
    @PostMapping
    public ResponseEntity<Node> createNode(@RequestBody Node node) {
        Node savedNode = nodeService.save(node);
        return ResponseEntity.ok(savedNode);
    }

    // GET ALL
    @GetMapping
    public ResponseEntity<@Nullable Object> getAllNodes() {
        return ResponseEntity.ok(nodeService.findAll());
    }

    // GET BY ID
    @GetMapping("/{id}")
    public ResponseEntity<@Nullable Object> getNodeById(@PathVariable Long id) {
        return ResponseEntity.ok(nodeService.findById(id));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<@Nullable Object> updateNode(@PathVariable Long id,
                                           @RequestBody Node node) {
        return ResponseEntity.ok(nodeService.updateNode(id, node));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteNode(@PathVariable Long id) {
        nodeService.delete(id);
        return ResponseEntity.ok("Node deleted successfully");
    }
}