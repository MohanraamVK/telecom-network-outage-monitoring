package com.telecom.network_monitor.repository;

import com.telecom.network_monitor.entity.Incident;
import com.telecom.network_monitor.enums.IncidentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IncidentRepository extends JpaRepository<Incident, Long> {

    List<Incident> findByDeletedFalse();

    List<Incident> findByDeletedTrue();

    List<Incident> findByNodeIdAndDeletedFalse(Long nodeId);

    List<Incident> findByStatusAndDeletedFalse(IncidentStatus status);

    Optional<Incident> findByIdAndDeletedTrue(Long id);

    Page<Incident> findByDeletedFalse(Pageable pageable);

    Page<Incident> findByStatusAndDeletedFalse(IncidentStatus status, Pageable pageable);

    long countByDeletedFalse();

    long countByDeletedTrue();

    long countByStatusAndDeletedFalse(IncidentStatus status);
}