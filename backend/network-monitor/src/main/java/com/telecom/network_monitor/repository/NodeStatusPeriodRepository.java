package com.telecom.network_monitor.repository;

import com.telecom.network_monitor.entity.NodeStatusPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface NodeStatusPeriodRepository extends JpaRepository<NodeStatusPeriod, Long> {

    Optional<NodeStatusPeriod> findFirstByNodeIdAndEndedAtIsNullOrderByStartedAtDesc(Long nodeId);

    List<NodeStatusPeriod> findByEndedAtIsNullAndAutoDetectedTrue();

    /** Periods that overlap [from, to). */
    @Query("""
            select p from NodeStatusPeriod p
            where p.startedAt < :to and (p.endedAt is null or p.endedAt > :from)
            """)
    List<NodeStatusPeriod> findOverlapping(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
