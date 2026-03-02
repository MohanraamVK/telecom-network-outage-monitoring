package com.telecom.network_monitor.service;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.repository.NodeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NodeService {

    private final NodeRepository nodeRepository;

    public NodeService(NodeRepository nodeRepository) {
        this.nodeRepository = nodeRepository;
    }

    public Node createNode(Node node) {
        return nodeRepository.save(node);
    }

    public List<Node> getAllNodes() {
        return nodeRepository.findAll();
    }

    public Node getNodeById(Long id) {
        return nodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Node not found"));
    }

    public Node updateNode(Long id, Node updatedNode) {
        Node existing = getNodeById(id);
        existing.setName(updatedNode.getName());
        existing.setLocation(updatedNode.getLocation());
        existing.setStatus(updatedNode.getStatus());
        return nodeRepository.save(existing);
    }

    public void deleteNode(Long id) {
        nodeRepository.deleteById(id);
    }
}