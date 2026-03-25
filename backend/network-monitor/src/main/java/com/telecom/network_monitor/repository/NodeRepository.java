package com.telecom.network_monitor.repository;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.NodeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NodeRepository extends JpaRepository<Node, Long> {

    List<Node> findByDeletedFalse();

    List<Node> findByDeletedTrue();

    Optional<Node> findByIdAndDeletedTrue(Long id);

    Page<Node> findByDeletedFalse(Pageable pageable);

    long countByDeletedFalse();

    long countByDeletedTrue();

    long countByStatusAndDeletedFalse(NodeStatus status);
}