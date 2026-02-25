package com.telecom.network_monitor.service;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.repository.NodeRepository;

import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NodeService {

    private final NodeRepository nodeRepository;

    public NodeService(NodeRepository nodeRepository) {
        this.nodeRepository = nodeRepository;
    }

    public Node save(Node node) {
        return nodeRepository.save(node);
    }

    public List<Node> findAll() {
        return nodeRepository.findAll();
    }

    public Node findById(Long id) {
        return nodeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Node not found"));
    }

    public void delete(Long id) {
        nodeRepository.deleteById(id);
    }

    public @Nullable Object updateNode(Long id, Node node) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'updateNode'");
    }
}