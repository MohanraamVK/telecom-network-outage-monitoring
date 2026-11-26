package com.telecom.network_monitor.repository;

import com.telecom.network_monitor.entity.Node;
import com.telecom.network_monitor.enums.NodeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

import java.util.List;
import java.util.Optional;

public interface NodeRepository extends JpaRepository<Node, Long>, JpaSpecificationExecutor<Node> {

    List<Node> findByDeletedFalse();

    List<Node> findByDeletedTrue();

    Optional<Node> findByIdAndDeletedTrue(Long id);

    Page<Node> findByDeletedFalse(Pageable pageable);

    long countByDeletedFalse();

    long countByDeletedTrue();

    long countByStatusAndDeletedFalse(NodeStatus status);

    List<Node> findByDeletedFalseAndMonitoredTrue();

    List<Node> findByDeletedFalseOrderByNameAsc();

    /**
     * Bulk update that bypasses the entity's version check on purpose: a background
     * heartbeat write must never make an admin's concurrent edit fail.
     */
    @Modifying
    @Query("update Node n set n.lastHeartbeatAt = :at where n.id = :id")
    int updateLastHeartbeat(@Param("id") Long id, @Param("at") LocalDateTime at);
}