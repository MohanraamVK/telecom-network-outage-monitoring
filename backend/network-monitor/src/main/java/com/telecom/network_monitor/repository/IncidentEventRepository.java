package com.telecom.network_monitor.repository;

import com.telecom.network_monitor.entity.IncidentEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IncidentEventRepository extends JpaRepository<IncidentEvent, Long> {

    List<IncidentEvent> findByIncidentIdOrderByCreatedAtAscIdAsc(Long incidentId);

    /** Latest events across all incidents, with incident and node loaded for the activity feed. */
    @EntityGraph(attributePaths = {"incident", "incident.node"})
    List<IncidentEvent> findAllByOrderByCreatedAtDescIdDesc(Pageable pageable);
}
